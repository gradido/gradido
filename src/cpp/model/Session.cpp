#include "Session.h"
#include "../lib/Profiler.h"
#include "../ServerConfig.h"

#include "Poco/RegularExpression.h"
#include "Poco/Net/StringPartSource.h"
#include "Poco/Net/MediaType.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/EmailManager.h"

#include "../tasks/PrepareEmailTask.h"
#include "../tasks/SendEmailTask.h"
#include "../tasks/SigningTransaction.h"

#include "../lib/JsonRequest.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "table/ModelBase.h"


#include "sodium.h"

using namespace Poco::Data::Keywords;

int WriteEmailVerification::run()
{	
	auto em = ErrorManager::getInstance();

	mEmailVerificationCode->getModel()->setUserId(mUser->getDBId());
	auto emailVerificationModel = mEmailVerificationCode->getModel();
	emailVerificationModel->setUserId(mUser->getDBId());
	if (!emailVerificationModel->insertIntoDB(true) || emailVerificationModel->errorCount() > 0) {
		emailVerificationModel->sendErrorsAsEmail();
		return -1;
	}

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
	: mHandleId(handle), mSessionUser(nullptr), mState(SESSION_STATE_EMPTY), mActive(false)
{

}

Session::~Session()
{
	//printf("[Session::~Session] \n");
	if (tryLock()) {
		unlock();
		reset();
	}
	
	
	//printf("[Session::~Session] finished \n");
}


void Session::reset()
{
	//printf("[Session::reset]\n");
	lock("Session::reset");
	
	mSessionUser = nullptr;
	mNewUser = nullptr;
	mEmailVerificationCodeObject = nullptr;

	// watch out
	//updateTimeout();
	mLastActivity = Poco::DateTime();
	
	mState = SESSION_STATE_EMPTY;
	
	mPassphrase = "";
	mClientLoginIP = Poco::Net::IPAddress();
	mEmailVerificationCodeObject = nullptr;
	unlock();
	//printf("[Session::reset] finished\n");
}

void Session::updateTimeout()
{
	lock("Session::updateTimeout");
	mLastActivity = Poco::DateTime();
	unlock();
}

Poco::AutoPtr<controller::EmailVerificationCode> Session::getEmailVerificationCodeObject()
{
	lock("Session::getEmailVerificationCodeObject");
	auto ret = mEmailVerificationCodeObject;
	unlock();
	return ret;
}

bool Session::createUser(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password)
{
	Profiler usedTime;
	auto sm = SessionManager::getInstance();
	if (!sm->isValid(first_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Vorname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")));
		return false;
	}
	if (!sm->isValid(last_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Nachname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")));
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error(gettext("E-Mail"), gettext("Bitte gebe eine g&uuml;ltige E-Mail Adresse an.")));
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
			addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits einen Account")));
			return false;
		}
	}
	catch (Poco::Exception& exc) {
		printf("mysql exception: %s\n", exc.displayText().data());
	}

	mSessionUser = new User(email.data(), first_name.data(), last_name.data());
	mNewUser = controller::User::create(email, first_name, last_name);
	updateTimeout();

	// Prepare E-Mail
	//UniLib::controller::TaskPtr prepareEmail(new PrepareEmailTask(ServerConfig::g_CPUScheduler));
	//prepareEmail->scheduleTask(prepareEmail);

	// create user crypto key
	UniLib::controller::TaskPtr cryptoKeyTask(new UserCreateCryptoKey(mSessionUser, password, ServerConfig::g_CryptoCPUScheduler));
	cryptoKeyTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_CRYPTO_KEY_GENERATED, this));
	cryptoKeyTask->scheduleTask(cryptoKeyTask);

	// depends on crypto key, write user record into db
	UniLib::controller::TaskPtr writeUserIntoDB(new UserWriteIntoDB(mSessionUser, ServerConfig::g_CPUScheduler, 1));
	writeUserIntoDB->setParentTaskPtrInArray(cryptoKeyTask, 0);
	writeUserIntoDB->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_USER_WRITTEN, this));
	writeUserIntoDB->scheduleTask(writeUserIntoDB);

	
	mEmailVerificationCodeObject = controller::EmailVerificationCode::create(model::table::EMAIL_OPT_IN_REGISTER);
	UniLib::controller::TaskPtr writeEmailVerification(new WriteEmailVerification(mSessionUser, mEmailVerificationCodeObject, ServerConfig::g_CPUScheduler, 1));
	
	writeEmailVerification->setParentTaskPtrInArray(writeUserIntoDB, 0);
	writeEmailVerification->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN, this));
	writeEmailVerification->scheduleTask(writeEmailVerification);
	

	/*printf("LastName: %s\n", last_name.data());
	for (int i = 0; i < last_name.size(); i++) {
		char c = last_name.data()[i];
		//printf("%d ", c);
	}
	//printf("\n\n");
	*/

	// depends on writeUser because need user_id, write email verification into db
	/*auto message = new Poco::Net::MailMessage;
	Poco::Net::MediaType mt("text", "plain");
	mt.setParameter("charset", "utf-8");
	message->setContentType(mt);

	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, email));
	message->setSubject(gettext("Gradido: E-Mail Verification"));
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
	*/
	//UniLib::controller::TaskPtr sendEmail(new SendEmailTask(message, ServerConfig::g_CPUScheduler, 1));
	//Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type);
	UniLib::controller::TaskPtr sendEmail(new SendEmailTask(new model::Email(mEmailVerificationCodeObject, mNewUser, model::EMAIL_USER_VERIFICATION_CODE), ServerConfig::g_CPUScheduler, 1));
	//sendEmail->setParentTaskPtrInArray(prepareEmail, 0);
	sendEmail->setParentTaskPtrInArray(writeEmailVerification, 0);
	sendEmail->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_SEND, this));
	sendEmail->scheduleTask(sendEmail);

	// write user into db
	// generate and write email verification into db
	// send email
	
	//printf("[Session::createUser] time: %s\n", usedTime.string().data());

	return true;
}

bool Session::ifUserExist(const std::string& email)
{
	auto em = ErrorManager::getInstance();
	const char* funcName = "Session::ifUserExist";
	auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement select(dbConnection);
	bool emailChecked = false;
	int userId = 0;
	select << "SELECT email_checked, id from users where email = ? and email_checked = 1",
		into(emailChecked), into(userId), useRef(email);

	try {
		if(select.execute() == 1) return true;
	}
	catch (Poco::Exception& ex) {
		em->addError(new ParamError(funcName, "select user from email verification code mysql error ", ex.displayText().data()));
		em->sendErrorsAsEmail();
	}
	return false;
}

int Session::updateEmailVerification(Poco::UInt64 emailVerificationCode)
{
	const static char* funcName = "Session::updateEmailVerification";
	lock(funcName);
	Profiler usedTime;
	
	auto em = ErrorManager::getInstance();
	if (mEmailVerificationCodeObject.isNull()) {
		em->addError(new Error(funcName, "email verification object is zero"));
		em->sendErrorsAsEmail();
		unlock();
		return -2;
	}
	auto emailVerificationCodeModel = mEmailVerificationCodeObject->getModel();
	if(emailVerificationCodeModel->getCode() == emailVerificationCode) {
		if (mSessionUser && mSessionUser->getDBId() == 0) {
			//addError(new Error("E-Mail Verification", "Benutzer wurde nicht richtig gespeichert, bitte wende dich an den Server-Admin"));
			em->addError(new Error(funcName, "user exist with 0 as id"));
			em->sendErrorsAsEmail();
			unlock();
			//return false;
			return -2;
		}
		
		// load correct user from db
		if (mNewUser.isNull() || mNewUser->getModel()->getID() != emailVerificationCodeModel->getUserId()) {
			mNewUser = controller::User::create();
			if (1 != mNewUser->load(emailVerificationCodeModel->getUserId())) {
				em->addError(new ParamError(funcName, "user load didn't return 1 with user_id ", emailVerificationCodeModel->getUserId()));
				em->sendErrorsAsEmail();
				unlock();
				return -2;
			}
		}

		auto userModel = mNewUser->getModel();
		bool firstEmailActivation = false;
		if (emailVerificationCodeModel->getType() == model::table::EMAIL_OPT_IN_REGISTER || emailVerificationCodeModel->getType() == model::table::EMAIL_OPT_IN_EMPTY) {
			firstEmailActivation = true;
		}
		if (firstEmailActivation && userModel->isEmailChecked()) {
			mSessionUser = new User(mNewUser);
			addError(new Error(gettext("E-Mail Verification"), gettext("Du hast dein Konto bereits aktiviert!")));
			unlock();
			return 1;
		}
		if (firstEmailActivation) {
			userModel->setEmailChecked(true);
			userModel->updateIntoDB("email_checked", 1);
			if (userModel->errorCount() > 0) {
				userModel->sendErrorsAsEmail();
			}
			unlock();
			updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
			return 0;
		}

		if (emailVerificationCodeModel->getType() == model::table::EMAIL_OPT_IN_RESET_PASSWORD) {
			unlock();
			if (mEmailVerificationCodeObject->deleteFromDB()) {
				mEmailVerificationCodeObject = nullptr;
			}
			else {
				em->getErrors(mEmailVerificationCodeObject->getModel());
				em->addError(new Error(funcName, "error deleting email verification code"));
				em->sendErrorsAsEmail();
				return -2;
			}
			updateState(SESSION_STATE_RESET_PASSWORD_REQUEST);
			return 0;
		}

		em->addError(new Error(funcName, "invalid code path"));
		em->sendErrorsAsEmail();
		unlock();
		return -2;
		
		/*if (updated_rows == 1) {
			Poco::Data::Statement delete_row(dbConnection);
			delete_row << "DELETE FROM email_opt_in where verification_code = ?", use(emailVerificationCode);
			if (delete_row.execute() != 1) {
				em->addError(new Error(funcName, "delete from email_opt_in entry didn't work as expected, please check db"));
				em->sendErrorsAsEmail();
			}
			if (mSessionUser) {
				mSessionUser->setEmailChecked();
				mSessionUser->setLanguage(getLanguage());
			}
			updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
			//printf("[%s] time: %s\n", funcName, usedTime.string().data());
			unlock();
			return true;
		}
		else {
			em->addError(new ParamError(funcName, "update user work not like expected, updated row count", updated_rows));
			em->sendErrorsAsEmail();
		}*/
		
		
	}
	else {
		addError(new Error(gettext("E-Mail Verification"), gettext("Falscher Code f&uuml;r aktiven Login")));
		//printf("[%s] time: %s\n", funcName, usedTime.string().data());
		unlock();
		return -1;
	}
	//printf("[%s] time: %s\n", funcName, usedTime.string().data());
	unlock();
	return 0;
}


int Session::resetPassword(Poco::AutoPtr<controller::User> user, bool passphraseMemorized)
{
	mNewUser = user;
	mSessionUser = new User(user);
	if (passphraseMemorized) {
		// first check if already exist		

		mEmailVerificationCodeObject = controller::EmailVerificationCode::create(mNewUser->getModel()->getID(), model::table::EMAIL_OPT_IN_RESET_PASSWORD);
		auto foundCount = mEmailVerificationCodeObject->load(user->getModel()->getID(), model::table::EMAIL_OPT_IN_RESET_PASSWORD);
		if (foundCount) {
			return 1;
		}
		auto emailVerificationModel = mEmailVerificationCodeObject->getModel();

		UniLib::controller::TaskPtr insertEmailVerificationCode(
			new model::table::ModelInsertTask(emailVerificationModel, true, true)
		);
		insertEmailVerificationCode->scheduleTask(insertEmailVerificationCode);
		UniLib::controller::TaskPtr sendEmail(new SendEmailTask(
			new model::Email(mEmailVerificationCodeObject, mNewUser, model::EMAIL_USER_RESET_PASSWORD),
			ServerConfig::g_CPUScheduler, 1)
		);
		sendEmail->setParentTaskPtrInArray(insertEmailVerificationCode, 0);
		sendEmail->scheduleTask(sendEmail);
	}
	else {
		EmailManager::getInstance()->addEmail(new model::Email(user, model::EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE));
	}

	return 0;
}

int Session::comparePassphraseWithSavedKeys(const std::string& inputPassphrase, Mnemonic* wordSource)
{
	KeyPair keys;
	static const char* functionName = "Session::comparePassphraseWithSavedKeys";
	if (!wordSource) {
		addError(new Error(functionName, "wordSource is empty"));
		sendErrorsAsEmail();
		return -2;
	}
	if (!keys.generateFromPassphrase(inputPassphrase.data(), wordSource)) {
		addError(new Error(gettext("Passphrase"), gettext("Deine Passphrase ist ung&uuml;tig")));
		return 0;
	}
	auto userModel = mNewUser->getModel();
	auto existingPublic = userModel->getPublicKey();
	if (!existingPublic) {
		userModel->loadFromDB("email", userModel->getEmail());
		existingPublic = userModel->getPublicKey();
		if (!existingPublic) {
			addError(new Error(gettext("Passphrase"), gettext("Ein Fehler trat auf, bitte versuche es erneut")));
			return -1;
		}
	}
	if (0 == memcmp(userModel->getPublicKey(), keys.getPublicKey(), crypto_sign_PUBLICKEYBYTES)) {
		mPassphrase = inputPassphrase;
		return 1;
	}
	addError(new Error(gettext("Passphrase"), gettext("Das ist nicht die richtige Passphrase.")));
	return 0;
}

bool Session::startProcessingTransaction(const std::string& proto_message_base64)
{
	lock("Session::startProcessingTransaction");
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
	lock("Session::getNextReadyTransaction");
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
	lock("Session::finalizeTransaction");
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

size_t Session::getProcessingTransactionCount() 
{ 
	size_t count = 0;
	lock("Session::getProcessingTransactionCount"); 

	for (auto it = mProcessingTransactions.begin(); it != mProcessingTransactions.end(); it++) {

		(*it)->lock();
		if ((*it)->errorCount() > 0) {
			(*it)->sendErrorsAsEmail();
			(*it)->unlock();
			it = mProcessingTransactions.erase(it);
			if (it == mProcessingTransactions.end()) break;
		}
		else {
			(*it)->unlock();
		}

	}
	count = mProcessingTransactions.size();
	unlock(); 
	return count; 
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
	lock("Session::loadUser");
	if (mSessionUser && mSessionUser->getEmail() != email) {
		mSessionUser = nullptr;
	}
	if (!mSessionUser) {
		// load user for email only once from db
		mSessionUser = new User(email.data());
	}
	if (mSessionUser->getUserState() >= USER_LOADED_FROM_DB) {
		if (!mSessionUser->validatePwd(password, this)) {
			unlock();
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
	lock("Session::deleteUser");
	bool bResult = false;
	if(mSessionUser) {
		JsonRequest phpServerRequest(ServerConfig::g_php_serverHost, 443);
		Poco::Net::NameValueCollection payload;
		payload.add("user", std::string(mSessionUser->getPublicKeyHex()));
		//auto ret = phpServerRequest.request("userDelete", payload);
		JsonRequestReturn ret = JSON_REQUEST_RETURN_OK;
		if (ret == JSON_REQUEST_RETURN_ERROR) {
			addError(new Error("Session::deleteUser", "php server error"));
			getErrors(&phpServerRequest);
			sendErrorsAsEmail();
		}
		else if (ret == JSON_REQUEST_RETURN_OK) {
			bResult = mSessionUser->deleteFromDB();
		}
		else {
			addError(new Error(gettext("Benutzer"), gettext("Konnte Community Server nicht erreichen. E-Mail an den Admin ist raus.")));
			unlock();
			return false;
		}
	}
	if(!bResult) {
		addError(new Error(gettext("Benutzer"), gettext("Fehler beim L&ouml;schen des Accounts. Bitte logge dich erneut ein und versuche es nochmal.")));
	}
	unlock();
	return bResult;
}

void Session::setLanguage(Languages lang)
{
	lock("Session::setLanguage");
	if (mLanguageCatalog.isNull() || mLanguageCatalog->getLanguage() != lang) {
		auto lm = LanguageManager::getInstance();
		mLanguageCatalog = lm->getFreeCatalog(lang);
	}
	unlock();
}

Languages Session::getLanguage()
{
	Languages lang = LANG_NULL;
	lock("Session::getLanguage");
	if (!mLanguageCatalog.isNull()) {
		lang = mLanguageCatalog->getLanguage();
	}
	unlock();
	return lang;
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

	int checkEmail = -1, resetPasswd = -1;
	try {
		auto emailVerificationCodeObjects = controller::EmailVerificationCode::load(mSessionUser->getDBId());

		for (int i = 0; i < emailVerificationCodeObjects.size(); i++) {
			auto type = emailVerificationCodeObjects[i]->getModel()->getType();
			if (type == model::table::EMAIL_OPT_IN_EMPTY || type == model::table::EMAIL_OPT_IN_REGISTER) {
				checkEmail = i;
			}
			else if (type == model::table::EMAIL_OPT_IN_RESET_PASSWORD) {
				resetPasswd = i;
			}
		}

		if (resetPasswd != -1) {
			mEmailVerificationCodeObject = emailVerificationCodeObjects[resetPasswd];
		}
		else if (checkEmail != -1) {
			mEmailVerificationCodeObject = emailVerificationCodeObjects[checkEmail];
		}
		
	}
	catch (Poco::Exception& ex) {
		printf("[Session::detectSessionState] exception: %s\n", ex.displayText().data());
		//return;
	}

	if (userState <= USER_EMAIL_NOT_ACTIVATED) {

		if (checkEmail != -1) {
			updateState(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN);
			return;
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

	if (resetPasswd != -1) {
		// don't go to reset password screen after login, only throw checkEmail
		//updateState(SESSION_STATE_RESET_PASSWORD_REQUEST);
		return;
	}

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
	auto em = ErrorManager::getInstance();

	mEmailVerificationCodeObject = controller::EmailVerificationCode::load(emailVerificationCode);
	if (mEmailVerificationCodeObject.isNull()) {
		addError(new Error(gettext("E-Mail Verification"), gettext("Konnte kein passendes Konto finden.")));
		return false;
	}

	mNewUser = controller::User::create();
	mNewUser->load(mEmailVerificationCodeObject->getModel()->getUserId());
	if (mNewUser->getModel()->errorCount() > 0) {
		mNewUser->getModel()->sendErrorsAsEmail();
		addError(new Error(gettext("E-Mail Verification"), gettext("Fehler beim laden des Benutzers.")));
		return false;
	}
	mSessionUser = new User(mNewUser);
	mSessionUser->setLanguage(getLanguage());

	auto verificationType = mEmailVerificationCodeObject->getModel()->getType();
	if (verificationType == model::table::EMAIL_OPT_IN_RESET_PASSWORD) {
		updateState(SESSION_STATE_RESET_PASSWORD_REQUEST);
	}
	else {
		updateState(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN);
	}

	return true;
}

void Session::updateState(SessionStates newState)
{
	lock("Session::updateState");
	if (!mActive) {
		unlock();
		return;
	}
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
	lock("Session::getSessionStateString");
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
	case SESSION_STATE_RESET_PASSWORD_REQUEST: return "Passwort reset requested";
	case SESSION_STATE_RESET_PASSWORD_SUCCEED: return "Passwort reset succeeded";
	default: return "unknown";
	}

	return "error";
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
		addError(new Error(gettext("Benutzer"), gettext("Kein g&uuml;ltiger Benutzer, bitte logge dich erneut ein.")));
		return false;
	}
	// delete passphrase after all went well
	mPassphrase.clear();

	return true;
}
