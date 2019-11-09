#include "Session.h"
#include "../lib/Profiler.h"
#include "../ServerConfig.h"

#include "Poco/RegularExpression.h"
#include "Poco/Net/StringPartSource.h"
#include "Poco/Net/MediaType.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"

#include "../tasks/PrepareEmailTask.h"
#include "../tasks/SendEmailTask.h"
#include "../tasks/SigningTransaction.h"


#include "sodium.h"

using namespace Poco::Data::Keywords;

int WriteEmailVerification::run()
{	
	Profiler timeUsed;
	auto em = ErrorManager::getInstance();
	
	//printf("[WriteEmailVerification::run] E-Mail Verification Code: %llu\n", verificationCode);
	auto dbSession = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	//int user_id = mUser->getDBId();
	Poco::Data::Statement insert(dbSession);
	insert << "INSERT INTO email_opt_in (user_id, verification_code) VALUES(?,?);",
		bind(mUser->getDBId()), use(mEmailVerificationCode);
	try {
		if (1 != insert.execute()) {
			em->addError(new Error("[WriteEmailVerification]", "error inserting email verification code"));
			em->sendErrorsAsEmail();
			return -1;
		}
	} catch (Poco::Exception& ex) {
		em->addError(new ParamError("[WriteEmailVerification]", "error inserting email verification code", ex.displayText().data()));
		em->sendErrorsAsEmail();
		return -2;
	}
	//printf("[WriteEmailVerification] timeUsed: %s\n", timeUsed.string().data());
	return 0;
}

// ---------------------------------------------------------------------------------------------------------------

int WritePassphraseIntoDB::run()
{
	Profiler timeUsed;

	// TODO: encrypt passphrase, need server admin crypto box pubkey
	//int crypto_box_seal(unsigned char *c, const unsigned char *m,
		//unsigned long long mlen, const unsigned char *pk);
	size_t mlen = mPassphrase.size();
	size_t crypto_size = crypto_box_SEALBYTES + mlen;

	auto em = ErrorManager::getInstance();

	auto dbSession = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement insert(dbSession);
	insert << "INSERT INTO user_backups (user_id, passphrase) VALUES(?,?)",
		use(mUserId), use(mPassphrase);
	try {
		if (insert.execute() != 1) {
			em->addError(new ParamError("WritePassphraseIntoDB::run", "inserting passphrase for user failed", std::to_string(mUserId)));
			em->sendErrorsAsEmail();
		}
	}
	catch (Poco::Exception& ex) {
		em->addError(new ParamError("WritePassphraseIntoDB::run", "insert passphrase mysql error", ex.displayText().data()));
		em->sendErrorsAsEmail();
	}

	//printf("[WritePassphraseIntoDB] timeUsed: %s\n", timeUsed.string().data());
	return 0;
}


// --------------------------------------------------------------------------------------------------------------

Session::Session(int handle)
	: mHandleId(handle), mSessionUser(nullptr), mEmailVerificationCode(0), mState(SESSION_STATE_EMPTY), mActive(false)
{

}

Session::~Session()
{
	//printf("[Session::~Session] \n");
	reset();
	//printf("[Session::~Session] finished \n");
}


void Session::reset()
{
	//printf("[Session::reset]\n");
	lock();
	
	mSessionUser = nullptr;

	// watch out
	//updateTimeout();
	mLastActivity = Poco::DateTime();
	
	mState = SESSION_STATE_EMPTY;
	
	mPassphrase = "";
	mClientLoginIP = Poco::Net::IPAddress();
	mEmailVerificationCode = 0;
	unlock();
	//printf("[Session::reset] finished\n");
}

void Session::updateTimeout()
{
	lock();
	mLastActivity = Poco::DateTime();
	unlock();
}

bool Session::createUser(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password)
{
	Profiler usedTime;
	auto sm = SessionManager::getInstance();
	if (!sm->isValid(first_name, VALIDATE_NAME)) {
		addError(new Error("Vorname", "Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;"));
		return false;
	}
	if (!sm->isValid(last_name, VALIDATE_NAME)) {
		addError(new Error("Nachname", "Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;"));
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error("E-Mail", "Bitte gebe eine g&uuml;ltige E-Mail Adresse an."));
		return false;
	}
	if (!sm->checkPwdValidation(password, this)) {
		return false;
	}
	/*if (passphrase.size() > 0 && !sm->isValid(passphrase, VALIDATE_PASSPHRASE)) {
		addError(new Error("Merkspruch", "Der Merkspruch ist nicht g&uuml;ltig, er besteht aus 24 W&ouml;rtern, mit Komma getrennt."));
		return false;
	}
	if (passphrase.size() == 0) {
		//mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);
		mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER]);
	}
	else {
		//mPassphrase = passphrase;
	}*/

	// check if user with that email already exist
	auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement select(dbConnection);
	select << "SELECT email from users where email = ?;", useRef(email);
	try {
		if (select.execute() > 0) {
			addError(new Error("E-Mail", "F&uuml;r diese E-Mail Adresse gibt es bereits einen Account"));
			return false;
		}
	}
	catch (Poco::Exception& exc) {
		printf("mysql exception: %s\n", exc.displayText().data());
	}

	mSessionUser = new User(email.data(), first_name.data(), last_name.data());
	updateTimeout();

	// Prepare E-Mail
	UniLib::controller::TaskPtr prepareEmail(new PrepareEmailTask(ServerConfig::g_CPUScheduler));
	prepareEmail->scheduleTask(prepareEmail);

	// create user crypto key
	UniLib::controller::TaskPtr cryptoKeyTask(new UserCreateCryptoKey(mSessionUser, password, ServerConfig::g_CryptoCPUScheduler));
	cryptoKeyTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_CRYPTO_KEY_GENERATED, this));
	cryptoKeyTask->scheduleTask(cryptoKeyTask);

	// depends on crypto key, write user record into db
	UniLib::controller::TaskPtr writeUserIntoDB(new UserWriteIntoDB(mSessionUser, ServerConfig::g_CPUScheduler, 1));
	writeUserIntoDB->setParentTaskPtrInArray(cryptoKeyTask, 0);
	writeUserIntoDB->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_USER_WRITTEN, this));
	writeUserIntoDB->scheduleTask(writeUserIntoDB);

	createEmailVerificationCode();

	UniLib::controller::TaskPtr writeEmailVerification(new WriteEmailVerification(mSessionUser, mEmailVerificationCode, ServerConfig::g_CPUScheduler, 1));
	writeEmailVerification->setParentTaskPtrInArray(writeUserIntoDB, 0);
	writeEmailVerification->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN, this));
	writeEmailVerification->scheduleTask(writeEmailVerification);

	printf("LastName: %s\n", last_name.data());
	for (int i = 0; i < last_name.size(); i++) {
		char c = last_name.data()[i];
		printf("%d ", c);
	}
	printf("\n\n");

	// depends on writeUser because need user_id, write email verification into db
	auto message = new Poco::Net::MailMessage;
	Poco::Net::MediaType mt("text", "plain");
	mt.setParameter("charset", "utf-8");
	message->setContentType(mt);

	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, email));
	message->setSubject("Gradido: E-Mail Verification");
	std::stringstream ss;
	ss << "Hallo " << first_name << " " << last_name << "," << std::endl << std::endl;
	ss << "Du oder jemand anderes hat sich soeben mit dieser E-Mail Adresse bei Gradido registriert. " << std::endl;
	ss << "Wenn du es warst, klicke bitte auf den Link: " << ServerConfig::g_serverPath << "/checkEmail/" << mEmailVerificationCode << std::endl;
	//ss << "oder kopiere den Code: " << mEmailVerificationCode << " selbst dort hinein." << std::endl;
	ss << "oder kopiere den obigen Link in Dein Browserfenster." << std::endl;
	ss << std::endl;
	ss << "Mit freundlichen " << u8"Grüßen" << std::endl;
	ss << "Dario, Gradido Server Admin" << std::endl;
	

	message->addContent(new Poco::Net::StringPartSource(ss.str()));

	UniLib::controller::TaskPtr sendEmail(new SendEmailTask(message, ServerConfig::g_CPUScheduler, 1));
	sendEmail->setParentTaskPtrInArray(prepareEmail, 0);
	sendEmail->setParentTaskPtrInArray(writeEmailVerification, 1);
	sendEmail->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_SEND, this));
	sendEmail->scheduleTask(sendEmail);


	// write user into db
	// generate and write email verification into db
	// send email
	
	//printf("[Session::createUser] time: %s\n", usedTime.string().data());

	return true;
}

bool Session::updateEmailVerification(Poco::UInt64 emailVerificationCode)
{

	Profiler usedTime;
	const static char* funcName = "Session::updateEmailVerification";
	auto em = ErrorManager::getInstance();
	if(mEmailVerificationCode == emailVerificationCode) {
		if (mSessionUser && mSessionUser->getDBId() == 0) {
			//addError(new Error("E-Mail Verification", "Benutzer wurde nicht richtig gespeichert, bitte wende dich an den Server-Admin"));
			em->addError(new Error(funcName, "user exist with 0 as id"));
			em->sendErrorsAsEmail();
			//return false;
		}
		
		// load correct user from db
		auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement update(dbConnection);

		update << "UPDATE users SET email_checked=1 where id = (SELECT user_id FROM email_opt_in where verification_code=?)", use(emailVerificationCode);
		auto updated_rows = update.execute();
		if (updated_rows == 1) {
			Poco::Data::Statement delete_row(dbConnection);
			delete_row << "DELETE FROM email_opt_in where verification_code = ?", use(emailVerificationCode);
			if (delete_row.execute() != 1) {
				em->addError(new Error(funcName, "delete from email_opt_in entry didn't work as expected, please check db"));
				em->sendErrorsAsEmail();
			}
			if (mSessionUser) {
				mSessionUser->setEmailChecked();
			}
			updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
			//printf("[%s] time: %s\n", funcName, usedTime.string().data());
			
			return true;
		}
		else {
			em->addError(new ParamError(funcName, "update user work not like expected, updated row count", updated_rows));
			em->sendErrorsAsEmail();
		}
		if (!updated_rows) {
			addError(new Error("E-Mail Verification", "Der Code stimmt nicht, bitte &uuml;berpr&uuml;fe ihn nochmal oder registriere dich erneut oder wende dich an den Server-Admin"));
			printf("[%s] time: %s\n", funcName, usedTime.string().data());
			return false;
		}
		
	}
	else {
		addError(new Error("E-Mail Verification", "Falscher Code f&uuml;r aktiven Login"));
		printf("[%s] time: %s\n", funcName, usedTime.string().data());
		return false;
	}
	//printf("[%s] time: %s\n", funcName, usedTime.string().data());
	return false;
}

bool Session::startProcessingTransaction(const std::string& proto_message_base64)
{
	lock();
	HASH hs = ProcessingTransaction::calculateHash(proto_message_base64);
	// check if it is already running or waiting
	for (auto it = mProcessingTransactions.begin(); it != mProcessingTransactions.end(); it++) {
		if (it->isNull()) {
			it = mProcessingTransactions.erase(it);
		}
		if (hs == (*it)->getHash()) {
			addError(new Error("Session::startProcessingTransaction", "transaction already in list"));
			unlock();
			return false;
		}
	}
	Poco::AutoPtr<ProcessingTransaction> processorTask(new ProcessingTransaction(proto_message_base64));
	processorTask->scheduleTask(processorTask);
	mProcessingTransactions.push_back(processorTask);
	unlock();
	return true;
	
}

Poco::AutoPtr<ProcessingTransaction> Session::getNextReadyTransaction(size_t* working/* = nullptr*/)
{
	lock();
	if (working) {
		*working = 0;
	}
	else if (!mCurrentActiveProcessingTransaction.isNull()) 
	{
		unlock();
		return mCurrentActiveProcessingTransaction;	
	}
	for (auto it = mProcessingTransactions.begin(); it != mProcessingTransactions.end(); it++) {
		if (working && !(*it)->isTaskFinished()) {
			*working++;
		}
		if (mCurrentActiveProcessingTransaction.isNull() && (*it)->isTaskFinished()) {
			if (!working) {
				mCurrentActiveProcessingTransaction = *it;
				unlock();
				return mCurrentActiveProcessingTransaction;
			}
			// no early exit
			else {
				mCurrentActiveProcessingTransaction = *it;
			}
			
		}
	}
	unlock();
	return mCurrentActiveProcessingTransaction;
}

void Session::finalizeTransaction(bool sign, bool reject)
{
	lock();
	if (mCurrentActiveProcessingTransaction.isNull()) {
		unlock();
		return;
	}
	mProcessingTransactions.remove(mCurrentActiveProcessingTransaction);
	
	if (!reject) {
		if (sign) {
			Poco::AutoPtr<SigningTransaction> signingTransaction(new SigningTransaction(mCurrentActiveProcessingTransaction, mSessionUser));
			signingTransaction->scheduleTask(signingTransaction);
		}
	}
	mCurrentActiveProcessingTransaction = nullptr;
	unlock();
}

bool Session::isPwdValid(const std::string& pwd)
{
	if (mSessionUser) {
		return mSessionUser->validatePwd(pwd, this);
	}
	return false;
}

UserStates Session::loadUser(const std::string& email, const std::string& password)
{
	//Profiler usedTime;
	lock();
	if (mSessionUser && mSessionUser->getEmail() != email) {
		mSessionUser = nullptr;
	}
	if (!mSessionUser) {
		// load user for email only once from db
		mSessionUser = new User(email.data());
	}
	if (mSessionUser->getUserState() >= USER_LOADED_FROM_DB) {
		if (!mSessionUser->validatePwd(password, this)) {
			return USER_PASSWORD_INCORRECT;
		}
	}
	else {
		User::fakeCreateCryptoKey();
	}

	/*if (!mSessionUser->validatePwd(password, this)) {
		addError(new Error("Login", "E-Mail oder Passwort nicht korrekt, bitte versuche es erneut!"));
		unlock();
		return false;
	}
	if (!mSessionUser->isEmailChecked()) {
		addError(new Error("Account", "E-Mail Adresse wurde noch nicht best&auml;tigt, hast du schon eine E-Mail erhalten?"));
		unlock();
		return false;
	}*/
	detectSessionState();
	unlock();

	return mSessionUser->getUserState();
}

bool Session::deleteUser()
{
	bool bResult = false;
	if(mSessionUser) {
		bResult = mSessionUser->deleteFromDB();
	}
	if(!bResult) {
		addError(new Error("Benutzer", "Fehler beim L&ouml;schen des Accounts. Bitte logge dich erneut ein und versuche es nochmal."));
	}
	
	return bResult;
}

/*
SESSION_STATE_CRYPTO_KEY_GENERATED,
SESSION_STATE_USER_WRITTEN,
SESSION_STATE_EMAIL_VERIFICATION_WRITTEN,
SESSION_STATE_EMAIL_VERIFICATION_SEND,
SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED,
SESSION_STATE_PASSPHRASE_GENERATED,
SESSION_STATE_PASSPHRASE_SHOWN,
SESSION_STATE_PASSPHRASE_WRITTEN,
SESSION_STATE_KEY_PAIR_GENERATED,
SESSION_STATE_KEY_PAIR_WRITTEN,
SESSION_STATE_COUNT
*/
void Session::detectSessionState()
{
	if (!mSessionUser || !mSessionUser->hasCryptoKey()) {
		return;
	}
	UserStates userState = mSessionUser->getUserState();
	/*
	if (mSessionUser->getDBId() == 0) {
		updateState(SESSION_STATE_CRYPTO_KEY_GENERATED);
		return;
	}*/
	if (userState <= USER_EMAIL_NOT_ACTIVATED) {

		if (mEmailVerificationCode == 0) {
			auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select(dbConnection);
			auto user_id = mSessionUser->getDBId();
			select << "SELECT verification_code from email_opt_in where user_id = ?",
				into(mEmailVerificationCode), use(user_id);
			try {
				if (select.execute() == 1) {
					updateState(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN);
					return;
				}
			}
			catch (Poco::Exception& ex) {
				printf("[Session::detectSessionState] mysql exception: %s\n", ex.displayText().data());
			}
		}
		
		updateState(SESSION_STATE_USER_WRITTEN);
		return;
	}

	if (USER_NO_KEYS == userState) {
		
		auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(dbConnection);
		Poco::Nullable<Poco::Data::BLOB> passphrase;
		auto user_id = mSessionUser->getDBId();
		select << "SELECT passphrase from user_backups where user_id = ?;", 
			into(passphrase), use(user_id);
		try {
			if (select.execute() == 1 && !passphrase.isNull()) {
				updateState(SESSION_STATE_PASSPHRASE_WRITTEN);
				return;
			}
		}
		catch (Poco::Exception& exc) {
			printf("[Session::detectSessionState] 2 mysql exception: %s\n", exc.displayText().data());
		}
		if (mPassphrase != "") {
			updateState(SESSION_STATE_PASSPHRASE_GENERATED);
			return;
		}
		updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
		return;
	}

	updateState(SESSION_STATE_KEY_PAIR_WRITTEN);

}

Poco::Net::HTTPCookie Session::getLoginCookie()
{
	auto keks = Poco::Net::HTTPCookie("GRADIDO_LOGIN", std::to_string(mHandleId));
	// prevent reading or changing cookie with js
	keks.setHttpOnly();
	keks.setPath("/");
	// send cookie only via https
#ifndef WIN32
	keks.setSecure(true);
#endif
	
	return keks;
}

bool Session::loadFromEmailVerificationCode(Poco::UInt64 emailVerificationCode)
{
	Profiler usedTime;
	const static char* funcName = "Session::loadFromEmailVerificationCode";
	auto em = ErrorManager::getInstance();
	auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	
	Poco::Data::Statement select(dbConnection);
	std::string email, first_name, last_name;
	int user_id = 0;
	select.reset(dbConnection);
	select << "SELECT user_id FROM email_opt_in WHERE verification_code=?",
		 into(user_id), use(emailVerificationCode);
	try {
		size_t rowCount = select.execute();
		if (rowCount != 1) {
			em->addError(new ParamError(funcName, "select user by email verification code work not like expected, selected row count", rowCount));
			em->sendErrorsAsEmail();
		}
		if (rowCount < 1) {
			addError(new Error("E-Mail Verification", "Konnte keinen passenden Account finden."));
			return false;
		}

		mSessionUser = new User(user_id);

		mEmailVerificationCode = emailVerificationCode;
		updateState(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN);
		//printf("[Session::loadFromEmailVerificationCode] time: %s\n", usedTime.string().data());
		return true;
	}
	catch (const Poco::Exception& ex) {
		em->addError(new ParamError(funcName, "error selecting user from verification code", ex.displayText().data()));
		em->sendErrorsAsEmail();
	}

	return false;
}

void Session::updateState(SessionStates newState)
{
	lock();
	if (!mActive) return;
	updateTimeout();
	//printf("[%s] newState: %s\n", __FUNCTION__, translateSessionStateToString(newState));
	if (newState > mState) {
		mState = newState;
	}

	unlock();
}

const char* Session::getSessionStateString()
{
	SessionStates state;
	lock();
	state = mState;
	unlock();
	return translateSessionStateToString(state);
}


const char* Session::translateSessionStateToString(SessionStates state)
{
	switch (state) {
	case SESSION_STATE_EMPTY: return "uninitalized";
	case SESSION_STATE_CRYPTO_KEY_GENERATED: return "crpyto key generated";
	case SESSION_STATE_USER_WRITTEN: return "User saved";
	case SESSION_STATE_EMAIL_VERIFICATION_WRITTEN: return "E-Mail verification code saved";
	case SESSION_STATE_EMAIL_VERIFICATION_SEND: return "Verification E-Mail sended";
	case SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED: return "Verification Code checked";
	case SESSION_STATE_PASSPHRASE_GENERATED: return "Passphrase generated";
	case SESSION_STATE_PASSPHRASE_SHOWN: return "Passphrase shown"; 
	case SESSION_STATE_PASSPHRASE_WRITTEN: return "Passphrase written";
	case SESSION_STATE_KEY_PAIR_GENERATED: return "Gradido Address created";
	case SESSION_STATE_KEY_PAIR_WRITTEN: return "Gradido Address saved";
	default: return "unknown";
	}

	return "error";
}

void Session::createEmailVerificationCode()
{
	uint32_t* code_p = (uint32_t*)&mEmailVerificationCode;
	for (int i = 0; i < sizeof(mEmailVerificationCode) / 4; i++) {
		code_p[i] = randombytes_random();
	}

}
/*
bool Session::useOrGeneratePassphrase(const std::string& passphase)
{
	if (passphase != "" && User::validatePassphrase(passphase)) {
		// passphrase is valid 
		setPassphrase(passphase);
		updateState(SESSION_STATE_PASSPHRASE_SHOWN);
		return true;
	}
	else {
		mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);
		updateState(SESSION_STATE_PASSPHRASE_GENERATED);
		return true;
	}
}
*/
bool Session::generatePassphrase()
{
	mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);
	updateState(SESSION_STATE_PASSPHRASE_GENERATED);
	return true;
}

bool Session::generateKeys(bool savePrivkey, bool savePassphrase)
{
	bool validUser = true;
	if (mSessionUser) {
		if (!mSessionUser->generateKeys(savePrivkey, mPassphrase, this)) {
			validUser = false;
		}
		else {
			if (savePassphrase) {
				//printf("[Session::generateKeys] create save passphrase task\n");
				UniLib::controller::TaskPtr savePassphrase(new WritePassphraseIntoDB(mSessionUser->getDBId(), mPassphrase));
				savePassphrase->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_PASSPHRASE_WRITTEN, this));
				savePassphrase->scheduleTask(savePassphrase);
			}
		}
	}
	else {
		validUser = false;
	}
	if (!validUser) {
		addError(new Error("Benutzer", "Kein g&uuml;ltiger Benutzer, bitte logge dich erneut ein."));
		return false;
	}
	// delete passphrase after all went well
	mPassphrase.clear();

	return true;
}
