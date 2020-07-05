#include "User.h"
#include "UserBackups.h"

#include "sodium.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"

#include "../lib/DataTypeConverter.h"

#include "../tasks/VerificationEmailResendTask.h"

#include "../ServerConfig.h"

#include "Poco/Timestamp.h"



namespace controller {
	User::User(model::table::User* dbModel)
		: mPassword(nullptr), mGradidoKeyPair(nullptr), mCanDecryptPrivateKey(false), mGradidoCurrentBalance(0)
	{
		mDBModel = dbModel;
	}

	User::~User()
	{
		if (mGradidoKeyPair) {
			delete mGradidoKeyPair;
			mGradidoKeyPair = nullptr;
		}
	}


	Poco::AutoPtr<User> User::create()
	{
		auto db = new model::table::User();
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}

	Poco::AutoPtr<User> User::create(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
	{
		auto db = new model::table::User(email, first_name, last_name, passwordHashed, languageKey);
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}
	
	std::vector<User*> User::search(const std::string& searchString)
	{
		
		auto sm = SessionManager::getInstance();
		auto db = new model::table::User();
		
		std::string globalSearch = "%" + searchString + "%";

		std::vector<model::table::UserTuple> resultFromDB;
		// check if search string is email
		/*if (sm->isValid(searchString, VALIDATE_EMAIL)) {
			resultFromDB = db->loadFromDB <std::string, model::table::UserTuple>("email", globalSearch);
		}
		else {*/
			std::vector<std::string> fieldNames =  { "first_name", "last_name", "email" };
			std::vector<std::string> fieldValues = { globalSearch, globalSearch, globalSearch };
			resultFromDB = db->loadFromDB<std::string, model::table::UserTuple>(fieldNames, fieldValues, model::table::MYSQL_CONDITION_OR);
		//}

		db->release();
		db = nullptr;

		std::vector<User*> resultVector;
		resultVector.reserve(resultFromDB.size());
		for (auto it = resultFromDB.begin(); it != resultFromDB.end(); it++) {
			resultVector.push_back(new User(new model::table::User(*it)));
		}
		return resultVector;

	}

	int User::load(const unsigned char* pubkey_array)
	{
		Poco::Data::BLOB pubkey(pubkey_array, 32);
		return getModel()->loadFromDB("pubkey", pubkey);
	}

	const std::string& User::getPublicHex()
	{
		if (mPublicHex != "") {
			return mPublicHex;
		}

		auto mm = MemoryManager::getInstance();

		lock("User::getJson");
		Poco::JSON::Object userObj;

		auto pubkey = getModel()->getPublicKey();

		if (pubkey) 
		{
			auto pubkeyHex = mm->getFreeMemory(65);
			memset(*pubkeyHex, 0, 65);
			sodium_bin2hex(*pubkeyHex, 65, pubkey, 32);
			mPublicHex = (char*)*pubkeyHex;
			mm->releaseMemory(pubkeyHex);	
		}
		
		unlock();
		return mPublicHex;
	}

	std::string User::getEmailWithNames()
	{
		std::stringstream ss;
		auto model = getModel();
		ss << model->getFirstName() << " " << model->getLastName() << "&lt;" << model->getEmail() << "&gt;";
		return ss.str();
	}

	Poco::JSON::Object User::getJson()
	{
		auto json = getModel()->getJson();
		auto pubkey = getPublicHex();
		//printf("[controller::User::getJson] this: %d\n", (int)this);
		if (pubkey != "") {
			json.set("public_hex", pubkey);
		}
		return json;
	}

	int User::login(const std::string& password)
	{
		if (!mPassword.isNull() && mPassword->hasKey()) {
			return 2;
		}
		auto observer = SingletonTaskObserver::getInstance();
		
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		assert(mPassword.isNull());

		auto model = getModel();
		auto email_hash = observer->makeHash(model->getEmail());
		if (observer->getTaskCount(email_hash, TASK_OBSERVER_PASSWORD_CREATION) > 0) {
			return -3;
		}
		observer->addTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		Poco::AutoPtr<AuthenticatedEncryption> authenticated_encryption(new AuthenticatedEncryption);
		assert(!authenticated_encryption.isNull() && model);
		authenticated_encryption->createKey(model->getEmail(), password);

		observer->removeTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);

		if (authenticated_encryption->getKeyHashed() == model->getPasswordHashed()) 
		{
		//	printf("[User::login] password key hashed is the same as saved password hash\n");
			MemoryBin* clear_private_key = nullptr;

			mPassword = authenticated_encryption;

			// additional check if saved private key found, decrypt and derive public key and compare with saved public key
			if (!model->hasPrivateKeyEncrypted()) {	
				return 1;
			}
			else 
			{
				if (AuthenticatedEncryption::AUTH_DECRYPT_OK == authenticated_encryption->decrypt(model->getPrivateKeyEncrypted(), &clear_private_key)) {
					if (mGradidoKeyPair) {
						if (mGradidoKeyPair->isTheSame(clear_private_key) == 0) {
							mCanDecryptPrivateKey = true;
							return 1;
						}
						else {
							delete mGradidoKeyPair;
							mGradidoKeyPair = nullptr;
						}
					}
					mGradidoKeyPair = new KeyPairEd25519(clear_private_key);
					if (!mGradidoKeyPair->isTheSame(model->getPublicKey())) {
						delete mGradidoKeyPair;
						mGradidoKeyPair = nullptr;
						//printf("pubkeys don't match\n");
						return -1;
					}
					//printf("correct pwd\n");
					mCanDecryptPrivateKey = true;
					return 1;
				}
				else {
					//printf("decrypt error\n");
					return -2;
				}

			}
		}
		
		// password didn't match
		//printf("password hashed key: %ull, model pwd hashed keys: %ull\n", authenticated_encryption->getKeyHashed(), model->getPasswordHashed());
		//printf("password: %d\n", (int)(mPassword.get()));
		return 0;
	}

	int User::setGradidoKeyPair(KeyPairEd25519* gradidoKeyPair)
	{
		assert(gradidoKeyPair);
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		if (mGradidoKeyPair) delete mGradidoKeyPair;
		mGradidoKeyPair = gradidoKeyPair;
		auto model = getModel();
		model->setPublicKey(mGradidoKeyPair->getPublicKey());
		if (mPassword && mPassword->hasKey()) {
			model->setPrivateKey(mGradidoKeyPair->getCryptedPrivKey(mPassword));
			mCanDecryptPrivateKey = true;
			return 1;
		}
		return 0;
	}
	int User::setNewPassword(const std::string& password)
	{
		auto observer = SingletonTaskObserver::getInstance();
		auto model = getModel();
		auto email_hash = observer->makeHash(model->getEmail());

		observer->addTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		Poco::AutoPtr<AuthenticatedEncryption> authenticated_encryption(new AuthenticatedEncryption);
		assert(!authenticated_encryption.isNull() && model);
		authenticated_encryption->createKey(model->getEmail(), password);

		observer->removeTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		return setNewPassword(authenticated_encryption);
	}


	int User::setNewPassword(Poco::AutoPtr<AuthenticatedEncryption> passwd) 
	{
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		auto model = getModel();

		if (!mPassword.isNull() && !passwd.isNull()) 
		{
			// if keys matched
			if (mPassword->isTheSame(passwd)) {
				return 0;
			}
			// if password exist but gradido key pair not, try to load key pair
			if ((!mGradidoKeyPair || !mGradidoKeyPair->hasPrivateKey()) && model->hasPrivateKeyEncrypted()) {
				//if (!mGradidoKeyPair) mGradidoKeyPair = new KeyPairEd25519;
				MemoryBin* clear_private_key = nullptr;
				if (AuthenticatedEncryption::AUTH_DECRYPT_OK == mPassword->decrypt(model->getPrivateKeyEncrypted(), &clear_private_key)) {
					if (mGradidoKeyPair && mGradidoKeyPair->isTheSame(clear_private_key) != 0) 
					{
						delete mGradidoKeyPair; 
						mGradidoKeyPair = nullptr;
					}
					if (!mGradidoKeyPair) 
					{
						mGradidoKeyPair = new KeyPairEd25519(clear_private_key);
					}
					
					// check if saved pubkey and from private key extracted pubkey match
					if (*mGradidoKeyPair != model->getPublicKey()) {
						delete mGradidoKeyPair;
						mGradidoKeyPair = nullptr;
						mCanDecryptPrivateKey = false;
						return -1;
					}
				}
			}
		}
		// replace old password with new
		mPassword = passwd;

		// set new encrypted password and hash
		model->setPasswordHashed(mPassword->getKeyHashed());
		int result = 2;
		if (mGradidoKeyPair && mGradidoKeyPair->hasPrivateKey()) {
			auto encryptedPrivateKey = mGradidoKeyPair->getCryptedPrivKey(mPassword);
			model->setPrivateKey(encryptedPrivateKey);
			MemoryManager::getInstance()->releaseMemory(encryptedPrivateKey);

			result = model->updatePrivkeyAndPasswordHash();
			mCanDecryptPrivateKey = true;
		}
		else {
			model->updateIntoDB("password", mPassword->getKeyHashed());
		}
		// save changes to db
		return result;
	}

	//! \return -1 no matching entry found
	//! \return -2 if user id is not set or invalid
	//! \return  0 matching entry found
	int User::tryLoadPassphraseUserBackup()
	{
		auto user_model = getModel();
		if (user_model->getID() <= 0) return -2;

		auto backups = UserBackups::load(user_model->getID());
		if (backups.size() == 0) return -1;
		for (auto it = backups.begin(); it != backups.end(); it++) {
			auto user_backup = *it;
			if (-1 == user_backup->getModel()->getMnemonicType()) {
				continue;
			}
			auto key_pair = std::unique_ptr<KeyPairEd25519>(user_backup->createGradidoKeyPair());
			if (key_pair->isTheSame(user_model->getPublicKey())) {
				return 0;
			}
		}
		return -1;
	}


	int User::checkIfVerificationEmailsShouldBeResend(const Poco::Util::Timer& timer)
	{
		auto cm = ConnectionManager::getInstance();
		auto em = ErrorManager::getInstance();
		static const char* function_name = "User::checkIfVerificationEmailsShouldBeResend";

		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);
		std::vector<Poco::Tuple<int,Poco::DateTime>> results;
		int email_checked = 0;
		int resend_count = 1;
		select << "select u.id, v.created from users as u "
			<< "LEFT JOIN email_opt_in as v ON(u.id = v.user_id) "
			<< "where u.email_checked = ? "
			<< "AND v.resend_count <= ?", Poco::Data::Keywords::use(email_checked), Poco::Data::Keywords::use(resend_count), Poco::Data::Keywords::into(results)
		;
		int result_count = 0;
		try {
			result_count = select.execute();
		}
		catch (Poco::Exception& ex) {
			em->addError(new ParamError(function_name, "mysql error by select", ex.displayText().data()));
			em->sendErrorsAsEmail();
			//return -1;
		}
		printf("result_count: %d\n", result_count);
		if (result_count > 0) {
			auto now = Poco::DateTime();

			int count_scheduled_at_once = 0;
			int count_scheduled = 0;

			for (auto it = results.begin(); it != results.end(); it++) {
				auto user_id = it->get<0>();
				auto created = it->get<1>();

				auto age = now - created;
				// older than 7 days, schedule at once
				if (age.days() > 7) {
					UniLib::controller::TaskPtr verificationResendTask(new VerificationEmailResendTask(user_id));
					verificationResendTask->scheduleTask(verificationResendTask);
					count_scheduled_at_once++;
				}
				// younger than 7 days, schedule for created + 7 days
				else {
					auto runDateTime = created + Poco::Timespan(7, 0, 0, 0, 0);
					ServerConfig::g_CronJobsTimer.schedule(new VerificationEmailResendTimerTask(user_id), Poco::Timestamp(runDateTime.timestamp()));
					count_scheduled++;
				}
			}
			if (count_scheduled_at_once) printf("scheduled %d verification email resend at once\n", count_scheduled_at_once);
			if (count_scheduled) printf("scheduled %d verification email resend in the next 7 days\n", count_scheduled);
		}
		return 0;
	}

}