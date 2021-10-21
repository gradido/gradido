#include "User.h"
#include "UserBackup.h"

#include "sodium.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"

#include "Group.h"

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

	Poco::AutoPtr<User> User::create(const std::string& email, const std::string& first_name, const std::string& last_name, int group_id, Poco::UInt64 passwordHashed/* = 0*/, std::string languageKey/* = "de"*/)
	{
		auto db = new model::table::User(email, first_name, last_name, group_id, passwordHashed, languageKey);
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}

	std::vector<User*> User::search(const std::string& searchString, const std::string& accountState /* = "all" */)
	{

		auto sm = SessionManager::getInstance();
		auto cm = ConnectionManager::getInstance();
		auto db = new model::table::User();
		static const char* functionName = "User::search";

		std::string globalSearch = "%" + searchString + "%";

		std::vector<model::table::UserTuple> resultFromDB;
		if (accountState == "email not activated") {

			std::vector<std::string> fieldNames = { "first_name", "last_name", "email", "email_checked" };
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			std::vector<model::table::UserTuple> results;
			// Poco::Tuple<int, std::string, std::string, std::string, std::string, std::string, Poco::Nullable<Poco::Data::BLOB>, Poco::DateTime, int, int, int> UserTuple;

			using namespace Poco::Data::Keywords;
			Poco::Data::Statement select(session);
			select << "SELECT id, first_name, last_name, email, username, description, pubkey, created, email_checked, disabled, group_id FROM " << db->getTableName();
			select << " where email_checked = 0 ";
			select, into(resultFromDB);
			if (searchString != "") {
				select << "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
				select, useRef(globalSearch), useRef(globalSearch), useRef(globalSearch);
			}
			try {
				select.execute();
			}
			catch (Poco::Exception& ex) {
				NotificationList errors;
				errors.addError(new ParamError(functionName, "mysql error ", ex.displayText()));
				errors.addError(new ParamError(functionName, "search string", searchString));
				errors.addError(new ParamError(functionName, "account state", accountState));
				errors.sendErrorsAsEmail();
			}
		}
		else {
			std::vector<std::string> fieldNames =  { "first_name", "last_name", "email" };
			std::vector<std::string> fieldValues = { globalSearch, globalSearch, globalSearch };
			resultFromDB = db->loadFromDB<std::string, model::table::UserTuple>(fieldNames, fieldValues, model::table::MYSQL_CONDITION_OR);
		}

		db->release();
		db = nullptr;

		std::vector<User*> resultVector;
		resultVector.reserve(resultFromDB.size());
		for (auto it = resultFromDB.begin(); it != resultFromDB.end(); it++) {
			resultVector.push_back(new User(new model::table::User(*it)));
		}
		return resultVector;

	}

	bool User::isUsernameAlreadyUsed(const std::string& username)
	{
		auto db = getModel();
		auto results = db->loadMultipleFromDB<model::table::UserTuple>({ "username", "group_id" }, username, db->getGroupId(), model::table::MYSQL_CONDITION_AND);
		return results.size() > 0;

	}

	int User::load(const unsigned char* pubkey_array)
	{
		Poco::Data::BLOB pubkey(pubkey_array, 32);
		return getModel()->loadFromDB("pubkey", pubkey);
	}

	int User::load(MemoryBin* emailHash)
	{
		Poco::Data::BLOB email_hash(*emailHash, crypto_generichash_BYTES);
		return getModel()->loadFromDB("email_hash", email_hash);
	}
	size_t User::load(const std::string& emailOrUsername)
	{
		auto model = getModel();
		if (1 == model->loadFromDB("email", emailOrUsername)) {
			return 1;
		}
		return model->loadFromDB("username", emailOrUsername);
	}
	Poco::AutoPtr<User> User::sload(int user_id)
	{
		auto db = new model::table::User();
		if (0 == db->loadFromDB("id", user_id)) {
			db->release();
			return nullptr;
		}
		auto user = new User(db);
		return Poco::AutoPtr<User>(user);
	}

	void User::reload()
	{
		getModel()->loadFromDB("id", getModel()->getID());
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

	Poco::AutoPtr<SecretKeyCryptography> User::createSecretKey(const std::string& password)
	{
		auto observer = SingletonTaskObserver::getInstance();

		auto model = getModel();
		auto email_hash = observer->makeHash(model->getEmail());
		if (observer->getTaskCount(email_hash, TASK_OBSERVER_PASSWORD_CREATION) > 0) {
			return nullptr;
		}
		observer->addTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		Poco::AutoPtr<SecretKeyCryptography> authenticated_encryption(new SecretKeyCryptography);
		assert(!authenticated_encryption.isNull() && model);
		authenticated_encryption->createKey(model->getEmail(), password);

		observer->removeTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		return authenticated_encryption;
	}

	int User::login(const std::string& password)
	{
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);

		if (!mPassword.isNull() && mPassword->hasKey()) {
			return 2;
		}
		assert(mPassword.isNull());
		
		auto authenticated_encryption = createSecretKey(password);
		if (authenticated_encryption.isNull()) {
			return -3;
		}
		auto model = getModel();
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
				if (SecretKeyCryptography::AUTH_DECRYPT_OK == authenticated_encryption->decrypt(model->getPrivateKeyEncrypted(), &clear_private_key)) {
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
					if (!model->getPublicKey()) {
						model->setPublicKey(mGradidoKeyPair->getPublicKey());
						model->updatePublickey();
					}
					else if (!mGradidoKeyPair->isTheSame(model->getPublicKey())) {
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
		Poco::AutoPtr<SecretKeyCryptography> authenticated_encryption(new SecretKeyCryptography);
		assert(!authenticated_encryption.isNull() && model);
		authenticated_encryption->createKey(model->getEmail(), password);

		observer->removeTask(email_hash, TASK_OBSERVER_PASSWORD_CREATION);
		return setNewPassword(authenticated_encryption);
	}


	int User::setNewPassword(Poco::AutoPtr<SecretKeyCryptography> passwd)
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
				if (SecretKeyCryptography::AUTH_DECRYPT_OK == mPassword->decrypt(model->getPrivateKeyEncrypted(), &clear_private_key)) {
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
	int User::tryLoadPassphraseUserBackup(KeyPairEd25519** createdKeyPair/* = nullptr*/)
	{
		auto user_model = getModel();
		if (user_model->getID() <= 0) return -2;

		auto backups = UserBackup::load(user_model->getID());
		if (backups.size() == 0) return -1;
		for (auto it = backups.begin(); it != backups.end(); it++) {
			auto user_backup = *it;
			if (-1 == user_backup->getModel()->getMnemonicType()) {
				continue;
			}
			auto key_pair = user_backup->createGradidoKeyPair();

			if (key_pair->isTheSame(user_model->getPublicKey())) {
				if (createdKeyPair) {
					*createdKeyPair = key_pair;
				}
				else {
					delete key_pair;
				}
				return 0;
			}
			delete key_pair;
		}
		return -1;
	}

	/*
	USER_EMPTY,
	USER_LOADED_FROM_DB,
	USER_PASSWORD_INCORRECT,
	USER_PASSWORD_ENCRYPTION_IN_PROCESS,
	USER_EMAIL_NOT_ACTIVATED,
	USER_NO_KEYS,
	USER_NO_PRIVATE_KEY,
	USER_NO_GROUP,
	USER_KEYS_DONT_MATCH,
	USER_COMPLETE,
	USER_DISABLED
	*/
	UserState User::getUserState()
	{
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		auto model = getModel();
		if (!model->getID() && model->getEmail() == "") {
			return USER_EMPTY;
		}
		if (!model->hasPrivateKeyEncrypted() && !model->hasPublicKey()) {
			return USER_NO_KEYS;
		}
		if (!model->hasPrivateKeyEncrypted()) {
			return USER_NO_PRIVATE_KEY;
		}
		if (!model->getGroupId()) {
			return USER_NO_GROUP;
		}
		if (!model->isEmailChecked()) {
			return USER_EMAIL_NOT_ACTIVATED;
		}
		return USER_COMPLETE;
	}


	int User::checkIfVerificationEmailsShouldBeResend(const Poco::Util::Timer& timer)
	{
		return 0;
		auto cm = ConnectionManager::getInstance();
		auto em = ErrorManager::getInstance();
		static const char* function_name = "User::checkIfVerificationEmailsShouldBeResend";

		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);
		std::vector<Poco::Tuple<int,Poco::DateTime>> results;
		int email_checked = 0;
		int resend_count = 1;
		std::string table_name_email_opt_in = "login_email_opt_in";
		select << "select u.id, v.created from " << db->getTableName() << " as u "
			<< "LEFT JOIN " << table_name_email_opt_in << " as v ON(u.id = v.user_id) "
			<< "where u.email_checked = ? "
			<< "AND v.resend_count <= ? "
			<< "ORDER BY u.id, v.created " ,
			Poco::Data::Keywords::use(email_checked), Poco::Data::Keywords::use(resend_count), Poco::Data::Keywords::into(results)
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
		//printf("result_count: %d\n", result_count);
		if (result_count > 0) {
			auto now = Poco::DateTime();

			int count_scheduled_at_once = 0;
			int count_scheduled = 0;

			int last_user_id = 0;
			// add 1 for resend task scheduled at once
			// add 2 for resend task scheduled in the future
			// reset if new user_id came up
			int scheduledResendTask = 0;
			// results sorted by user_id
			//printf("results count: %d\n", results.size());

			for (auto it = results.begin(); it != results.end(); it++) {
				auto user_id = it->get<0>();
				auto created = it->get<1>();

				//auto created_str = Poco::DateTimeFormatter::format(created, "%f.%m.%y %H:%M");
				//printf("user_id: %d, created: %s\n", user_id, created_str.data());

				if (user_id != last_user_id) {
					assert(user_id > last_user_id);
					last_user_id = user_id;
					scheduledResendTask = 0;
				}
				if (scheduledResendTask == 3) continue;

				auto age = now - created;
				//printf("age: %d\n", age.days());
				// older than 7 days, schedule at once
				if (age.days() > 7 && !(scheduledResendTask & 1)) {
					UniLib::controller::TaskPtr verificationResendTask(new VerificationEmailResendTask(user_id));
					verificationResendTask->scheduleTask(verificationResendTask);
					count_scheduled_at_once++;
					scheduledResendTask |= 1;
				}
				// younger than 7 days, schedule for created + 7 days
				else if(!(scheduledResendTask & 2)) {
					auto runDateTime = created + Poco::Timespan(7, 0, 0, 0, 0);
					ServerConfig::g_CronJobsTimer.schedule(new VerificationEmailResendTimerTask(user_id), Poco::Timestamp(runDateTime.timestamp()));
					count_scheduled++;
					scheduledResendTask |= 2;
				}
				//if(count_scheduled_at_once > )
			}
			if (count_scheduled_at_once) printf("scheduled %d verification email resend at once\n", count_scheduled_at_once);
			if (count_scheduled) printf("scheduled %d verification email resend in the next 7 days\n", count_scheduled);
		}
		return 0;
	}

	int User::addMissingEmailHashes()
	{
		auto cm = ConnectionManager::getInstance();
		auto em = ErrorManager::getInstance();
		static const char* function_name = "User::addMissingEmailHashes";

		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);
		std::vector<Poco::Tuple<int, std::string>> results;

		select << "select id, email from " << db->getTableName()
			<< " where email_hash IS NULL "
			, Poco::Data::Keywords::into(results)
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
		if (0 == result_count) return 0;
		std::vector<Poco::Tuple<Poco::Data::BLOB, int>> updates;
		// calculate hashes
		updates.reserve(results.size());
		unsigned char email_hash[crypto_generichash_BYTES];
		for (auto it = results.begin(); it != results.end(); it++) {
			memset(email_hash, 0, crypto_generichash_BYTES);
			auto id = it->get<0>();
			auto email = it->get<1>();
			crypto_generichash(email_hash, crypto_generichash_BYTES,
				(const unsigned char*)email.data(), email.size(),
				NULL, 0);
			updates.push_back(Poco::Tuple<Poco::Data::BLOB, int>(Poco::Data::BLOB(email_hash, crypto_generichash_BYTES), id));
		}

		// update db
		// reuse connection, I hope it's working
		Poco::Data::Statement update(session);
		update << "UPDATE " << db->getTableName() << " set email_hash = ? where id = ?"
			   , Poco::Data::Keywords::use(updates);
		int updated_count = 0;
		try {
			updated_count = update.execute();
		}
		catch (Poco::Exception& ex) {
			em->addError(new ParamError(function_name, "mysql error by update", ex.displayText().data()));
			em->sendErrorsAsEmail();
		}
		return updated_count;
	}


	std::string User::getGroupBaseUrl()
	{
		UNIQUE_LOCK;
		static const char* function_name = "User::getGroupBaseUrl";
		if (mGroupBaseUrl != "") {
			printf("[%s] return saved group base Url: %s\n", function_name, mGroupBaseUrl.data());
			return mGroupBaseUrl;
		}

		auto model = getModel();
		if (!model->getGroupId()) {
			printf("[%s] return ServerConfig::g_php_serverPath because no group id\n", function_name);
			return ServerConfig::g_php_serverPath;
		}
		auto group = controller::Group::load(model->getGroupId());
        if (!group.isNull()) {
            auto group_model = group->getModel();
            if (ServerConfig::g_ServerSetupType == ServerConfig::SERVER_TYPE_TEST) {
                mGroupBaseUrl = "http://" + group_model->getUrl() + group_model->getHome();
            }
            else {
                mGroupBaseUrl = "https://" + group_model->getUrl() + group_model->getHome();
            }
            printf("[%s] return group base Url: %s from Group\n", function_name, mGroupBaseUrl.data());
            return mGroupBaseUrl;
        }
        return ServerConfig::g_php_serverPath;
	}

	Poco::AutoPtr<controller::Group> User::getGroup()
	{
		auto model = getModel();
		if (!model->getGroupId()) {
			return nullptr;
		}
		return controller::Group::load(model->getGroupId());
	}

}
