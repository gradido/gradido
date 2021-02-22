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
#include "../SingletonManager/SingletonTaskObserver.h"

#include "../tasks/PrepareEmailTask.h"
#include "../tasks/SendEmailTask.h"
#include "../tasks/SigningTransaction.h"
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"
#include "../tasks/VerificationEmailResendTask.h"

#include "../lib/JsonRequest.h"

#include "../Crypto/Passphrase.h"


#include "../controller/User.h"
#include "../controller/UserBackups.h"
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
	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	mSessionUser.assign(nullptr);
	mNewUser.assign(nullptr);
	mEmailVerificationCodeObject.assign(nullptr);

	// watch out
	//updateTimeout();
	mLastActivity = Poco::DateTime();
	
	mState = SESSION_STATE_EMPTY;
	
	mPassphrase = "";
	mLastExternReferer = "";
	mClientLoginIP = Poco::Net::IPAddress();
	unlock();

	// reset transactions
	mCurrentActiveProcessingTransaction = nullptr;
	mProcessingTransactions.clear();

	//printf("[Session::reset] finished\n");
}

int Session::isActive()
{
	int ret = 0; 
	try {
		mWorkMutex.tryLock(100);
	}
	catch (Poco::TimeoutException &ex) {
		return -1;
	}
	ret = (int)mActive;
	unlock(); 
	return ret;

}

bool Session::isDeadLocked()
{
	try {
		mWorkMutex.tryLock(200);
		unlock();
		return false;
	}
	catch (Poco::Exception& ex) {
		
	}
	return true;
}

bool Session::setActive(bool active)
{ 
	try {
		mWorkMutex.tryLock(100);
	}
	catch (Poco::TimeoutException &ex) {
		return false;
	}
	mActive = active; 
	unlock(); 
	return true;
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
	std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
	auto ret = mEmailVerificationCodeObject;
	unlock();
	return ret;
}

bool Session::adminCreateUser(const std::string& first_name, const std::string& last_name, const std::string& email)
{
	Profiler usedTime;

	if (mNewUser->getModel()->getRole() != model::table::ROLE_ADMIN) {
		addError(new Error(gettext("Benutzer"), gettext("Eingeloggter Benutzer ist kein Admin")), false);
		return false;
	}

	auto sm = SessionManager::getInstance();
	if (!sm->isValid(first_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Vorname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(last_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Nachname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error(gettext("E-Mail"), gettext("Bitte gebe eine g&uuml;ltige E-Mail Adresse an.")), false);
		return false;
	}


	// check if user with that email already exist
	if (mNewUser->getModel()->isExistInDB("email", email)) {
		addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits einen Account")), false);
		return false;
	}

	auto newUser = controller::User::create(email, first_name, last_name);
	updateTimeout();


	auto newUserModel = newUser->getModel();
	if (!newUserModel->insertIntoDB(true)) {
		addError(new Error(gettext("Benutzer"), gettext("Fehler beim speichern!")));
		return false;
	}

	auto email_verification_code = controller::EmailVerificationCode::create(newUserModel->getID(), model::table::EMAIL_OPT_IN_REGISTER);
	if (!email_verification_code->getModel()->insertIntoDB(false)) {
		addError(new Error(gettext("Email Verification Code"), gettext("Fehler beim speichern!")));
		return false;
	}
	
	EmailManager::getInstance()->addEmail(new model::Email(email_verification_code, newUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE));

	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	mEmailVerificationCodeObject = email_verification_code;
	

	return true;
}
//
bool Session::createUser(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password)
{
	Profiler usedTime;
	auto sm = SessionManager::getInstance();
	if (!sm->isValid(first_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Vorname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(last_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Nachname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error(gettext("E-Mail"), gettext("Bitte gebe eine g&uuml;ltige E-Mail Adresse an.")), false);
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
			addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits einen Account")), false);
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
	UniLib::controller::TaskPtr cryptoKeyTask(new UserCreateCryptoKey(mSessionUser, mNewUser, password, ServerConfig::g_CryptoCPUScheduler));
	cryptoKeyTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_CRYPTO_KEY_GENERATED, this));
	cryptoKeyTask->scheduleTask(cryptoKeyTask);

	// depends on crypto key, write user record into db
	UniLib::controller::TaskPtr writeUserIntoDB(new UserWriteIntoDB(mSessionUser, ServerConfig::g_CPUScheduler, 1));
	writeUserIntoDB->setParentTaskPtrInArray(cryptoKeyTask, 0);
	writeUserIntoDB->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_USER_WRITTEN, this));
	writeUserIntoDB->scheduleTask(writeUserIntoDB);

	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
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

bool Session::createUserDirect(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password)
{
	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	static const char* function_name = "Session::createUserDirect";
	auto sm = SessionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto email_manager = EmailManager::getInstance();

	if (!sm->isValid(first_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Vorname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(last_name, VALIDATE_NAME)) {
		addError(new Error(gettext("Nachname"), gettext("Bitte gebe einen Namen an. Mindestens 3 Zeichen, keines folgender Zeichen <>&;")), false);
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error(gettext("E-Mail"), gettext("Bitte gebe eine g&uuml;ltige E-Mail Adresse an.")), false);
		return false;
	}
	if (!sm->checkPwdValidation(password, this)) {
		return false;
	}

	// check if email already exist
	auto user = controller::User::create();
	if (user->load(email) >= 1) {
		addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits ein Konto")), false);
		return false;
	}

	// user
	mNewUser = controller::User::create(email, first_name, last_name);
	auto user_model = mNewUser->getModel();
	user_model->insertIntoDB(true);
	auto user_id = user_model->getID();
	

	// one retry in case of connection error
	if (!user_id) {
		user_model->insertIntoDB(true);
		auto user_id = user_model->getID();
		if (!user_id) {
			em->addError(new ParamError(function_name, "error saving new user in db, after one retry with email", email));
			em->sendErrorsAsEmail();
			addError(new Error(gettext("Server"), gettext("Fehler beim speichen des Kontos bitte versuche es später noch einmal")), false);
			return false;
		}
	}

	generateKeys(true, true);

	// calculate encryption key, could need some time, will save encrypted privkey to db
	UniLib::controller::TaskPtr create_authenticated_encrypten_key = new AuthenticatedEncryptionCreateKeyTask(mNewUser, password);
	create_authenticated_encrypten_key->scheduleTask(create_authenticated_encrypten_key);

	// email verification code
	auto email_verification = controller::EmailVerificationCode::create(user_id, model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
	email_verification->getModel()->insertIntoDB(false);
	mEmailVerificationCodeObject = email_verification;

	auto _7days_later = Poco::DateTime() + Poco::Timespan(7, 0, 0, 0, 0);
	ServerConfig::g_CronJobsTimer.schedule(new VerificationEmailResendTimerTask(user_id), Poco::Timestamp(_7days_later.timestamp()));

	email_manager->addEmail(new model::Email(email_verification, mNewUser, model::EMAIL_USER_VERIFICATION_CODE));

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
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	// new mutex, will replace the Poco Mutex complete in the future
	std::unique_lock<std::shared_mutex> _lock_shared(mSharedMutex);
	Profiler usedTime;
	
	auto em = ErrorManager::getInstance();
	if (mEmailVerificationCodeObject.isNull()) {
		em->addError(new Error(funcName, "email verification object is zero"));
		em->sendErrorsAsEmail();
	
		return -2;
	}
	auto email_verification_code_model = mEmailVerificationCodeObject->getModel();
	assert(email_verification_code_model);
	if(email_verification_code_model->getCode() == emailVerificationCode) {
		if (mSessionUser && mSessionUser->getDBId() == 0) {
			//addError(new Error("E-Mail Verification", "Benutzer wurde nicht richtig gespeichert, bitte wende dich an den Server-Admin"));
			em->addError(new Error(funcName, "user exist with 0 as id"));
			em->sendErrorsAsEmail();
			
			//return false;
			return -2;
		}
		
		// load correct user from db
		if (mNewUser.isNull() || !mNewUser->getModel() || mNewUser->getModel()->getID() != email_verification_code_model->getUserId()) {
			mNewUser = controller::User::create();
			if (1 != mNewUser->load(email_verification_code_model->getUserId())) {
				em->addError(new ParamError(funcName, "user load didn't return 1 with user_id ", email_verification_code_model->getUserId()));
				em->sendErrorsAsEmail();
				
				return -2;
			}
		}

		auto user_model = mNewUser->getModel();
		assert(user_model);
		bool first_email_activation = false;
		auto verification_type = email_verification_code_model->getType();
		if (model::table::EMAIL_OPT_IN_REGISTER == verification_type || 
			model::table::EMAIL_OPT_IN_EMPTY == verification_type    ||
			model::table::EMAIL_OPT_IN_REGISTER_DIRECT == verification_type) {
			first_email_activation = true;
		}
		if (first_email_activation && user_model->isEmailChecked()) {
			mSessionUser = new User(mNewUser);
			addError(new Error(gettext("E-Mail Verification"), gettext("Du hast dein Konto bereits aktiviert!")), false);
			
			return 1;
		}
		if (first_email_activation) {
			user_model->setEmailChecked(true);

			user_model->updateIntoDB("email_checked", 1);
			if (user_model->errorCount() > 0) {
				user_model->sendErrorsAsEmail();
			}

			// no find all active sessions
			
			updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
			return 0;
		}

		if (email_verification_code_model->getType() == model::table::EMAIL_OPT_IN_RESET_PASSWORD) {
			
			if (mEmailVerificationCodeObject->deleteFromDB()) {
				mEmailVerificationCodeObject.assign(nullptr);
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
		
		return -1;
	}
	//printf("[%s] time: %s\n", funcName, usedTime.string().data());
	
	return 0;
}


int Session::sendResetPasswordEmail(Poco::AutoPtr<controller::User> user, bool passphraseMemorized)
{
	mNewUser = user;
	mSessionUser = new User(user);
	auto em = EmailManager::getInstance();

	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);

	// creating email verification code also for user without passphrase
	// first check if already exist		
	// check if email was already send shortly before
	bool frequent_resend = false;
	bool email_already_send = false;

	mEmailVerificationCodeObject = controller::EmailVerificationCode::load(user->getModel()->getID(), model::table::EMAIL_OPT_IN_RESET_PASSWORD);
	if (mEmailVerificationCodeObject.isNull()) {
		mEmailVerificationCodeObject = controller::EmailVerificationCode::create(mNewUser->getModel()->getID(), model::table::EMAIL_OPT_IN_RESET_PASSWORD);
		mEmailVerificationCodeObject->getModel()->insertIntoDB(false);
	}
	else {
		email_already_send = true;
	}
	auto email_verification_model = mEmailVerificationCodeObject->getModel();
	if (email_already_send) {
		auto time_elapsed = Poco::DateTime() - email_verification_model->getUpdated();
		if (time_elapsed.totalHours() < 1) {
			frequent_resend = true;
		}
	}

	if (!frequent_resend) {
		if (passphraseMemorized) {
			em->addEmail(new model::Email(mEmailVerificationCodeObject, mNewUser, model::EMAIL_USER_RESET_PASSWORD));
		}
		else {
			em->addEmail(new model::Email(user, model::EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE));
		}
	}

	if (frequent_resend) return 2;
	if (email_already_send) return 1;

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
		addError(new ParamError(functionName, "invalid passphrase", inputPassphrase));
		if (!mNewUser.isNull() && mNewUser->getModel()) {
			addError(new ParamError(functionName, "user email", mNewUser->getModel()->getEmail()));
		}
		sendErrorsAsEmail();
		addError(new Error(gettext("Passphrase"), gettext("Deine Passphrase ist ung&uuml;tig")), false);
		return 0;
	}
	auto userModel = mNewUser->getModel();
	auto existingPublic = userModel->getPublicKey();
	if (!existingPublic) {
		userModel->loadFromDB("email", userModel->getEmail());
		existingPublic = userModel->getPublicKey();
		if (!existingPublic) {
			addError(new Error(functionName, "cannot load existing public key from db"));
			addError(new ParamError(functionName, "user email", userModel->getEmail()));
			sendErrorsAsEmail();
			addError(new Error(gettext("Passphrase"), gettext("Ein Fehler trat auf, bitte versuche es erneut")), false);
			return -1;
		}
	}
	if (0 == memcmp(userModel->getPublicKey(), keys.getPublicKey(), crypto_sign_PUBLICKEYBYTES)) {
		mPassphrase = inputPassphrase;
		return 1;
	}
	addError(new Error(gettext("Passphrase"), gettext("Das ist nicht die richtige Passphrase.")), false);
	return 0;
}

bool Session::startProcessingTransaction(const std::string& proto_message_base64)
{
	static const char* funcName = "Session::startProcessingTransaction";
	lock(funcName);
	HASH hs = ProcessingTransaction::calculateHash(proto_message_base64);
	// check if it is already running or waiting
	for (auto it = mProcessingTransactions.begin(); it != mProcessingTransactions.end(); it++) {
		if (it->isNull()) {
			it = mProcessingTransactions.erase(it);
		}
		if (hs == (*it)->getHash()) {
			addError(new Error(funcName, "transaction already in list"));
			unlock();
			return false;
		}
	}
	if (mSessionUser.isNull() || !mSessionUser->getEmail()) {
		addError(new Error(funcName, "user is zero"));
		unlock();
		return false;
	}

	Poco::AutoPtr<ProcessingTransaction> processorTask(
		new ProcessingTransaction(
			proto_message_base64, 
			DRMakeStringHash(mSessionUser->getEmail()),
			mSessionUser->getLanguage())
	);
	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_AUTO_SIGN_TRANSACTIONS) == ServerConfig::UNSECURE_AUTO_SIGN_TRANSACTIONS) {
		if (processorTask->run() != 0) {
			getErrors(processorTask);
			unlock();
			return false;
		}
		Poco::AutoPtr<SigningTransaction> signingTransaction(new SigningTransaction(processorTask, mNewUser));
		//signingTransaction->scheduleTask(signingTransaction);
		if (signingTransaction->run() != 0) {
			getErrors(signingTransaction);
			unlock();
			return false;
		}
		
	}
	else {
		processorTask->scheduleTask(processorTask);
		mProcessingTransactions.push_back(processorTask);
	}
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
			(*working)++;
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

bool Session::finalizeTransaction(bool sign, bool reject)
{
	int result = -1;
	lock("Session::finalizeTransaction");
	if (mCurrentActiveProcessingTransaction.isNull()) {
		unlock();
		return false;
	}
	mProcessingTransactions.remove(mCurrentActiveProcessingTransaction);
	
	if (!reject) {
		if (sign) {
			Poco::AutoPtr<SigningTransaction> signingTransaction(new SigningTransaction(mCurrentActiveProcessingTransaction, mNewUser));
			//signingTransaction->scheduleTask(signingTransaction);
			result = signingTransaction->run();
		}
	}
	mCurrentActiveProcessingTransaction.assign(nullptr);
	unlock();
	return result == 0;
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
	static const char* functionName = "Session::loadUser";
	auto observer = SingletonTaskObserver::getInstance();
	if (email != "") {
		if (observer->getTaskCount(email, TASK_OBSERVER_PASSWORD_CREATION) > 0) {
			return USER_PASSWORD_ENCRYPTION_IN_PROCESS;
		}
	}
	//Profiler usedTime;
	//printf("before lock\n");
	lock(functionName);
	//printf("locked \n");
	if (!mSessionUser.isNull() && mSessionUser->getEmail() != email) {
		mSessionUser.assign(nullptr);
		mNewUser.assign(nullptr);
		//printf("user nullptr assigned\n");
	}
	//printf("after checking if session user is null\n");
	//if (!mSessionUser) {
	if (mNewUser.isNull()) {
		//printf("new user is null\n");
		mNewUser = controller::User::create();
		//printf("new user created\n");
		// load user for email only once from db
		mNewUser->load(email);
		//printf("load new user from db with email: %s\n", email.data());
		mSessionUser = new User(mNewUser);
		//mSessionUser = new User(email.data());

		//printf("user loaded from email\n");
	}
	//printf("before get model\n");
	auto user_model = mNewUser->getModel();
	if (user_model && user_model->isDisabled()) {
		return USER_DISABLED;
	}
	//printf("before if login\n");
	if (!mSessionUser.isNull() && mSessionUser->getUserState() >= USER_LOADED_FROM_DB) {
		//printf("before login\n");
		int loginResult = 0;
		int exitCount = 0;
		do {
			loginResult = mNewUser->login(password);
			Poco::Thread::sleep(100);
			exitCount++;
		} while (-3 == loginResult && exitCount < 15);
		if (exitCount > 1) {
			addError(new ParamError(functionName, "login succeed, retrys: ", exitCount));
			addError(new ParamError(functionName, "email: ", email));
			sendErrorsAsEmail();
		}

		if (exitCount >= 15) 
		{
			auto running_password_creations = observer->getTasksCount(TASK_OBSERVER_PASSWORD_CREATION);

			addError(new ParamError(functionName, "login failed after 15 retrys and 100 ms sleep between, currently running passwort creation tasks: ", running_password_creations));
			addError(new ParamError(functionName, "email: ", email));
			sendErrorsAsEmail();
			return USER_PASSWORD_ENCRYPTION_IN_PROCESS;
		}
		
		//printf("new user login with result: %d\n", loginResult);
		
		if (-1 == loginResult) {
			addError(new Error(functionName, "error in user data set, saved pubkey didn't match extracted pubkey from private key"));
			addError(new ParamError(functionName, "user email", mNewUser->getModel()->getEmail()));
			sendErrorsAsEmail();
			//unlock();
			//return USER_KEYS_DONT_MATCH;
		}
		if (0 == loginResult) {
			unlock();
			return USER_PASSWORD_INCORRECT;
		}
		// error decrypting private key
		if (-2 == loginResult) {
			// check if we have access to the passphrase, if so we can reencrypt the private key
			printf("try reencrypting key\n");
			auto user_model = mNewUser->getModel();
			auto user_backups = controller::UserBackups::load(user_model->getID());
			for (auto it = user_backups.begin(); it != user_backups.end(); it++) {
				auto key = std::unique_ptr<KeyPairEd25519>((*it)->createGradidoKeyPair());
				if (key->isTheSame(user_model->getPublicKey())) 
				{
					
					// set valid key pair
					if (1 == mNewUser->setGradidoKeyPair(key.release())) {
						// save new encrypted private key
						user_model->updatePrivkey();
					}
					else {
						auto em = ErrorManager::getInstance();
						em->addError(new Error(functionName, "error reencrypt private key"));
						em->addError(new ParamError(functionName, "for user with email", user_model->getEmail()));
						em->sendErrorsAsEmail();
					}
					break;
				}
			}
		}
		// can be removed if session user isn't used any more
		// don't calculate password two times anymore
		mSessionUser->login(mNewUser);
		//printf("after old user login\n");
		/*if (mNewUser->getModel()->getPasswordHashed() && !mSessionUser->validatePwd(password, this)) {
			unlock();
			return USER_PASSWORD_INCORRECT;
		}*/
	}
	else {
		//printf("before sleep\n");
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
	//printf("before detect session state\n");
	detectSessionState();
	unlock();
	//printf("before return user state\n");
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
	//printf("[Session::setLanguage] new language: %d\n", lang);
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
	if (mSessionUser.isNull() || !mSessionUser->hasCryptoKey()) {
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
		std::unique_lock<std::shared_mutex> _lock_shared(mSharedMutex);
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
		
		auto user_id = mSessionUser->getDBId();
		auto userBackups = controller::UserBackups::load(user_id);

		// check passphrase, only possible while passphrase isn't crypted in db
		bool correctPassphraseFound = false;
		// always trigger SESSION_STATE_PASSPHRASE_WRITTEN, else lost of data possible
		bool cryptedPassphrase = userBackups.size() > 0;
		for (auto it = userBackups.begin(); it != userBackups.end(); it++) {
			KeyPair keys;
			auto passphrase = (*it)->getModel()->getPassphrase();
			Mnemonic* wordSource = nullptr;
			if (User::validatePassphrase(passphrase, &wordSource)) {
				if (keys.generateFromPassphrase((*it)->getModel()->getPassphrase().data(), wordSource)) {
					if (sodium_memcmp(mSessionUser->getPublicKey(), keys.getPublicKey(), ed25519_pubkey_SIZE) == 0) {
						correctPassphraseFound = true;
						break;
					}
				}
			}
			else {
				cryptedPassphrase = true;
			}
		}
		/*
		auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(dbConnection);
		Poco::Nullable<Poco::Data::BLOB> passphrase;
		
		select << "SELECT passphrase from user_backups where user_id = ?;", 
			into(passphrase), use(user_id);
		try {
			if (select.execute() == 1 && !passphrase.isNull()) {
				//KeyPair keys;keys.generateFromPassphrase(passphrase.value().rawContent())
				updateState(SESSION_STATE_PASSPHRASE_WRITTEN);
				return;
			}
		}
		catch (Poco::Exception& exc) {
			printf("[Session::detectSessionState] 2 mysql exception: %s\n", exc.displayText().data());
		}*/
		if (correctPassphraseFound || cryptedPassphrase) {
			updateState(SESSION_STATE_PASSPHRASE_WRITTEN);
			return;
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
	// send cookie only via https, on linux, except in test builds 
#ifndef WIN32
	if (ServerConfig::SERVER_TYPE_PRODUCTION == ServerConfig::g_ServerSetupType ||
		ServerConfig::SERVER_TYPE_STAGING == ServerConfig::g_ServerSetupType) {
		keks.setSecure(true);
	}
#endif
	
	return keks;
}

bool Session::loadFromEmailVerificationCode(Poco::UInt64 emailVerificationCode)
{
	Profiler usedTime;
	auto em = ErrorManager::getInstance();
	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	mEmailVerificationCodeObject = controller::EmailVerificationCode::load(emailVerificationCode);
	if (mEmailVerificationCodeObject.isNull()) {
		addError(new Error(gettext("E-Mail Verification"), gettext("Konnte kein passendes Konto finden.")));
		return false;
	}

	mNewUser = controller::User::create();
	assert(mEmailVerificationCodeObject->getModel() && mEmailVerificationCodeObject->getModel()->getUserId());
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
	if (mNewUser.isNull()) return false;
	
	auto lang = getLanguage();
	if (lang == LANG_EN) {
		mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);
	}
	else {
		mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER]);
	}
	//mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER]);
	updateState(SESSION_STATE_PASSPHRASE_GENERATED);
	return true;
}

bool Session::generateKeys(bool savePrivkey, bool savePassphrase)
{
	if (mNewUser.isNull()) {
		addError(new Error(gettext("Benutzer"), gettext("Kein g&uuml;ltiger Benutzer, bitte logge dich erneut ein.")));
		return false;
	}
	static const char* function_name = "Session::generateKeys";
	auto lang = getLanguage();
	auto user_model = mNewUser->getModel();
	auto mnemonic_type = ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER;
	/*if (LANG_DE == lang) {
		mnemonic_type = ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES;
	}*/

	auto passphrase = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[mnemonic_type]);
	if (!passphrase) {
		addError(new ParamError(function_name, "Error generating passphrase with mnemonic: ", mnemonic_type));
		addError(new ParamError(function_name, "user email: ", mNewUser->getModel()->getEmail()));
		sendErrorsAsEmail();
		addError(new Error(gettext("Benutzer"), gettext("Fehler beim generieren der Passphrase, der Admin bekommt eine E-Mail. ")));
		return false;
	}

	if (savePassphrase) {
		auto user_backup = controller::UserBackups::create(user_model->getID(), passphrase->getString(), mnemonic_type);
		// sync version
		//user_backup->getModel()->insertIntoDB(false);	

		// async version
		UniLib::controller::TaskPtr save_user_backup_task = new model::table::ModelInsertTask(user_backup->getModel(), false, true);
		save_user_backup_task->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_PASSPHRASE_WRITTEN, this));
		save_user_backup_task->scheduleTask(save_user_backup_task);
	}

	// keys	
	auto gradido_key_pair = KeyPairEd25519::create(passphrase);
	auto set_key_result = mNewUser->setGradidoKeyPair(gradido_key_pair);
	size_t result_save_key = 0;
	if (1 == set_key_result && savePrivkey) {
		// save public key and private key in db
		result_save_key = user_model->updatePubkeyAndPrivkey();
	}
	else {
		// save public key in db
		result_save_key = user_model->updatePublickey();
	}
	if (!result_save_key) {
		user_model->addError(new Error(function_name, "Error saving new generated pubkey"));
		user_model->addError(new ParamError(function_name, "e-mail: ", user_model->getEmail()));
		user_model->sendErrorsAsEmail();
		//addError(new Error(gettext("Benutzer"), gettext("Fehler beim Speichern der Keys, der Admin bekommt eine E-Mail. Evt. nochmal versuchen oder abwarten!")));
		return false;
	}
	return true;
	/*

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
	*/
}
