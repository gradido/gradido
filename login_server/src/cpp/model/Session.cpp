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
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"
#include "../tasks/VerificationEmailResendTask.h"

#include "../lib/JsonRequest.h"

#include "../Crypto/Passphrase.h"


#include "../controller/User.h"
#include "../controller/UserBackup.h"
#include "../controller/EmailVerificationCode.h"

#include "table/UserRole.h"

#include "table/ModelBase.h"


#include "sodium.h"

using namespace Poco::Data::Keywords;



// --------------------------------------------------------------------------------------------------------------

Session::Session(int handle)
	: mHandleId(handle), mState(SESSION_STATE_EMPTY), mActive(false)
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


	//printf("[Session::reset] finished\n");
}

int Session::isActive()
{
	int ret = 0;

    if(!mWorkMutex.tryLock(100)) {
        return -1;
    }

	ret = (int)mActive;

	try {
        unlock();
    } catch(Poco::SystemException& ex) {
        addError(new ParamError("Session::isActive", "exception unlocking mutex", ex.what()));
        return -1;
    }
	return ret;

}

bool Session::isDeadLocked()
{
    if(!mWorkMutex.tryLock(200)) {
        return true;
    };
    unlock();
    return false;
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

bool Session::adminCreateUser(const std::string& first_name, const std::string& last_name, const std::string& email, int group_id, const std::string &baseUrl)
{
	Profiler usedTime;
	auto user_model = mNewUser->getModel();
	if (user_model->getRole() != model::table::ROLE_ADMIN) {
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
	if (user_model->isExistInDB("email", email)) {
		addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits einen Account")), false);
		return false;
	}

	auto newUser = controller::User::create(email, first_name, last_name, group_id);
	updateTimeout();

	auto newUserModel = newUser->getModel();
	if (!newUserModel->insertIntoDB(true)) {
		addError(new Error(gettext("Benutzer"), gettext("Fehler beim speichern!")));
		return false;
	}

	auto email_verification_code = controller::EmailVerificationCode::create(newUserModel->getID(), model::table::EMAIL_OPT_IN_REGISTER);
	email_verification_code->setBaseUrl(baseUrl);
	if (!email_verification_code->getModel()->insertIntoDB(false)) {
		addError(new Error(gettext("Email Verification Code"), gettext("Fehler beim speichern!")));
		return false;
	}


	EmailManager::getInstance()->addEmail(new model::Email(email_verification_code, newUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE));

	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	mEmailVerificationCodeObject = email_verification_code;


	return true;
}


bool Session::createUserDirect(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password, const std::string &baseUrl)
{
	std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
	static const char* function_name = "Session::createUserDirect";
	auto sm = SessionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto email_manager = EmailManager::getInstance();

	if (mLanguageCatalog.isNull()) {
		mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(LANG_DE);
	}

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

	if (!sm->checkPwdValidation(password, this, mLanguageCatalog)) {
		return false;
	}

	// check if email already exist
	auto user = controller::User::create();
	if (user->load(email) >= 1) {
		addError(new Error(gettext("E-Mail"), gettext("F&uuml;r diese E-Mail Adresse gibt es bereits ein Konto")), false);
		return false;
	}

	// user
	int group_id = 0;
	if (ServerConfig::g_devDefaultGroup != "") {
		auto groups = controller::Group::load(ServerConfig::g_devDefaultGroup);
		if (groups.size() == 1) {
			group_id = groups[0]->getModel()->getID();
		}
	}
	mNewUser = controller::User::create(email, first_name, last_name, group_id);
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


	// if it gets id 1, it's the first user, so we should give him the admin role
	if (user_id == 1) {
		Poco::AutoPtr<model::table::UserRole> user_role(new model::table::UserRole(user_id, model::table::ROLE_ADMIN));
		user_role->insertIntoDB(false);
		mNewUser->reload();
	}


	generateKeys(true, true);

	// calculate encryption key, could need some time, will save encrypted privkey to db
	UniLib::controller::TaskPtr create_authenticated_encrypten_key = new AuthenticatedEncryptionCreateKeyTask(mNewUser, password);
	create_authenticated_encrypten_key->scheduleTask(create_authenticated_encrypten_key);

	// email verification code
	auto email_verification = controller::EmailVerificationCode::create(user_id, model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
	email_verification->setBaseUrl(baseUrl + "/checkEmail");
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
	if(email_verification_code_model->getCode() == emailVerificationCode)
	{
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

	}
	else {
		addError(new Error(gettext("E-Mail Verification"), gettext("Falscher Code f&uuml;r aktiven Login")));
		//printf("[%s] time: %s\n", funcName, usedTime.string().data());

		return -1;
	}
	//printf("[%s] time: %s\n", funcName, usedTime.string().data());

	return 0;
}


int Session::sendResetPasswordEmail(Poco::AutoPtr<controller::User> user, bool passphraseMemorized, const std::string& baseUrl)
{
	mNewUser = user;
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
	if (baseUrl.size() > 0) {
		mEmailVerificationCodeObject->setBaseUrl(baseUrl);
	}
	auto email_verification_model = mEmailVerificationCodeObject->getModel();
	if (email_already_send) {
		auto time_elapsed = Poco::DateTime() - email_verification_model->getUpdated();
		if (time_elapsed.totalMinutes() < 10) {
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

int Session::comparePassphraseWithSavedKeys(const std::string& inputPassphrase, const Mnemonic* wordSource)
{

	static const char* functionName = "Session::comparePassphraseWithSavedKeys";
	if (!wordSource) {
		addError(new Error(functionName, "wordSource is empty"));
		sendErrorsAsEmail();
		return -2;
	}
	auto passphrase = Passphrase::create(inputPassphrase, wordSource);
	// if (!keys.generateFromPassphrase(inputPassphrase.data(), wordSource)) {
	if (passphrase.isNull() || !passphrase->checkIfValid()) {
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
	auto keys = KeyPairEd25519::create(passphrase);
	if (keys) {
		auto cmp_result = memcmp(userModel->getPublicKey(), keys->getPublicKey(), crypto_sign_PUBLICKEYBYTES);
		delete keys;
		keys = nullptr;
		if (0 == cmp_result) {
			mPassphrase = inputPassphrase;
			return 1;
		}
	}
	addError(new Error(gettext("Passphrase"), gettext("Das ist nicht die richtige Passphrase.")), false);
	return 0;
}

UserState Session::loadUser(const std::string& email, const std::string& password)
{
	static const char* functionName = "Session::loadUser";
	auto observer = SingletonTaskObserver::getInstance();
	auto sm = SessionManager::getInstance();

	if (email != "") {
		if (observer->getTaskCount(email, TASK_OBSERVER_PASSWORD_CREATION) > 0) {
			return USER_PASSWORD_ENCRYPTION_IN_PROCESS;
		}
	}
	//Profiler usedTime;
	//printf("before lock\n");
	//lock(functionName);
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

	//if (!mSessionUser) {
	if (mNewUser.isNull()) {
		//printf("new user is null\n");
		mNewUser = controller::User::create();
		//printf("new user created\n");
		// load user for email only once from db
		mNewUser->load(email);
		//printf("load new user from db with email: %s\n", email.data());
		//mSessionUser = new User(mNewUser);
		//mSessionUser = new User(email.data());

		//printf("user loaded from email\n");
	}
	//printf("before get model\n");
	auto user_model = mNewUser->getModel();
	if (user_model && user_model->isDisabled()) {
		return USER_DISABLED;
	}
	if (mNewUser->getUserState() >= USER_LOADED_FROM_DB) {

		NotificationList pwd_errors;
		auto lm = LanguageManager::getInstance();
		auto lang_key = mNewUser->getModel()->getLanguageKey();
		if (mLanguageCatalog.isNull()) {
			mLanguageCatalog = lm->getFreeCatalog(lm->languageFromString(lang_key));
		}

		if (!sm->checkPwdValidation(password, &pwd_errors, mLanguageCatalog))
		{
			Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
			return USER_PASSWORD_INCORRECT;
		}

		int loginResult = mNewUser->login(password);
		int exitCount = 0;
		if (loginResult == -3)
		{
			do
			{
				Poco::Thread::sleep(100);
				loginResult = mNewUser->login(password);
				exitCount++;
			} while (-3 == loginResult && exitCount < 15);
			if (exitCount > 1)
			{
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
		}

		if (-1 == loginResult)
		{
			addError(new Error(functionName, "error in user data set, saved pubkey didn't match extracted pubkey from private key"));
			addError(new ParamError(functionName, "user email", mNewUser->getModel()->getEmail()));
			sendErrorsAsEmail();
			//unlock();
			//return USER_KEYS_DONT_MATCH;
		}
		if (0 == loginResult)
		{
			return USER_PASSWORD_INCORRECT;
		}
		// error decrypting private key
		if (-2 == loginResult)
		{
			// check if we have access to the passphrase, if so we can reencrypt the private key
			printf("try reencrypting key\n");
			auto user_model = mNewUser->getModel();
			auto user_backups = controller::UserBackup::load(user_model->getID());
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

	}
	else {
		Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
	}

	detectSessionState();
	if (0 == mNewUser->getModel()->getGroupId()) {
		return USER_NO_GROUP;
	}

	return mNewUser->getUserState();
}

bool Session::deleteUser()
{
	lock("Session::deleteUser");
	bool bResult = false;
	if(!mNewUser.isNull()) {
		JsonRequest phpServerRequest(ServerConfig::g_php_serverHost, 443);
		Poco::Net::NameValueCollection payload;
		auto user_model = mNewUser->getModel();
		payload.add("user", user_model->getPublicKeyHex());
		//auto ret = phpServerRequest.request("userDelete", payload);
		JsonRequestReturn ret = JSON_REQUEST_RETURN_OK;
		if (ret == JSON_REQUEST_RETURN_ERROR) {
			addError(new Error("Session::deleteUser", "php server error"));
			getErrors(&phpServerRequest);
			sendErrorsAsEmail();
		}
		else if (ret == JSON_REQUEST_RETURN_OK) {
			bResult = user_model->deleteFromDB();
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
	if (mNewUser.isNull() || !mNewUser->getModel() || mNewUser->getPassword().isNull()) {
		return;
	}
	UserState userState = mNewUser->getUserState();

	int checkEmail = -1, resetPasswd = -1;
	try {
		auto emailVerificationCodeObjects = controller::EmailVerificationCode::load(mNewUser->getModel()->getID());

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

		auto user_id = mNewUser->getModel()->getID();
		auto userBackups = controller::UserBackup::load(user_id);

		// check passphrase, only possible while passphrase isn't crypted in db
		bool correctPassphraseFound = false;
		// always trigger SESSION_STATE_PASSPHRASE_WRITTEN, else lost of data possible
		bool cryptedPassphrase = userBackups.size() > 0;
		for (auto it = userBackups.begin(); it != userBackups.end(); it++) {
			auto passphrase = (*it)->getModel()->getPassphrase();
			const Mnemonic* wordSource = Passphrase::detectMnemonic(passphrase);
			auto passphrase_obj = Passphrase::create(passphrase, wordSource);
			if (!passphrase_obj.isNull() && passphrase_obj->checkIfValid()) {
				auto key_pair = KeyPairEd25519::create(passphrase_obj);
				if (key_pair && key_pair->isTheSame(mNewUser->getModel()->getPublicKey())) {
					correctPassphraseFound = true;
					//break;
				}
				if (key_pair) {
					delete key_pair;
				}
				if (correctPassphraseFound) {
					break;
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
//	keks.setHttpOnly();

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
	// TODO: Maybe update language key by user, is session has another, or update only with options-menu

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

bool Session::lastTransactionTheSame(Poco::AutoPtr<model::gradido::Transaction> newTransaction)
{
	assert(!newTransaction.isNull());
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	if (mLastTransaction.isNull()) {
		return false;
	}
	bool result = mLastTransaction->isTheSameTransaction(newTransaction);
	return result;
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
		auto user_backup = controller::UserBackup::create(user_model->getID(), passphrase->getString(), mnemonic_type);
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
