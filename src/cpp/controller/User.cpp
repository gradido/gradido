#include "User.h"

#include "sodium.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ErrorManager.h"

#include "../lib/DataTypeConverter.h"

#include "../tasks/VerificationEmailResendTask.h"

#include "../ServerConfig.h"

#include "Poco/Timestamp.h"

namespace controller {
	User::User(model::table::User* dbModel)
		: mPassword(nullptr), mGradidoKeyPair(nullptr)
	{
		mDBModel = dbModel;
	}

	User::~User()
	{
		if (mPassword) {
			delete mPassword;
			mPassword = nullptr;
		}
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
		if (mPassword && mPassword->hasKey()) {
			return 2;
		}
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		auto authenticated_encryption = new AuthenticatedEncryption();
		auto model = getModel();
		assert(authenticated_encryption && model);

		authenticated_encryption->createKey(model->getEmail(), password);
		if (authenticated_encryption->getKeyHashed() == model->getPasswordHashed()) {
			MemoryBin* clear_private_key = nullptr;

			if (mPassword) delete mPassword;
			mPassword = authenticated_encryption;

			if (!model->hasPrivateKeyEncrypted()) {
				return 1;
			}
			else {
				auto priv_key_encrypted = model->getPrivateKeyEncrypted();
				auto priv_key_bin = MemoryManager::getInstance()->getFreeMemory(priv_key_encrypted.size());
				memcpy(*priv_key_bin, priv_key_encrypted.data(), priv_key_encrypted.size());
				if (AuthenticatedEncryption::AUTH_DECRYPT_OK == authenticated_encryption->decrypt(priv_key_bin, &clear_private_key)) {
					auto gradido_key_pair = new KeyPairEd25519(clear_private_key);
					if (*gradido_key_pair != model->getPublicKey()) {
						delete mPassword; 
						mPassword = nullptr;
						delete gradido_key_pair;
						return -1;
					}
					if (mGradidoKeyPair) delete mGradidoKeyPair;
					mGradidoKeyPair = gradido_key_pair;
			
					return 1;
				}
			}
		}
		delete authenticated_encryption;

		// password didn't match
		return 0;
	}

	int User::setGradidoKeyPair(KeyPairEd25519* gradidoKeyPair)
	{
		assert(gradidoKeyPair);
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		if (mGradidoKeyPair) delete mGradidoKeyPair;
		mGradidoKeyPair = gradidoKeyPair;
		getModel()->setPublicKey(mGradidoKeyPair->getPublicKey());
		if (mPassword && mPassword->hasKey()) {
			auto model = getModel();
			model->setPrivateKey(mGradidoKeyPair->getCryptedPrivKey(mPassword));
			return 1;
		}
		return 0;
	}

	int User::setPassword(AuthenticatedEncryption* passwd) 
	{
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		auto model = getModel();
		const static char* function_name = "controller::User::setPassword";

		if (mPassword) 
		{
			// if keys matched
			if (*mPassword == *passwd) {
				// but separate objects
				if (mPassword != passwd) {
					delete passwd;
				}
				return 0;
			}
			// if password exist but gradido key pair not, try to load key pair
			if ((!mGradidoKeyPair || !mGradidoKeyPair->hasPrivateKey()) && model->hasPrivateKeyEncrypted()) {
				//if (!mGradidoKeyPair) mGradidoKeyPair = new KeyPairEd25519;
				MemoryBin* clear_private_key = nullptr;
				if (AuthenticatedEncryption::AUTH_DECRYPT_OK == mPassword->decrypt(model->getPrivateKeyEncrypted(), &clear_private_key)) {
					if (mGradidoKeyPair) delete mGradidoKeyPair;
					mGradidoKeyPair = new KeyPairEd25519(clear_private_key);
					
					// check if saved pubkey and from private key extracted pubkey match
					if (*mGradidoKeyPair != model->getPublicKey()) {
						delete mGradidoKeyPair;
						mGradidoKeyPair = nullptr;
						delete passwd;
						return -1;
					}
				}
			}
		}
		// replace old password with new
		if (mPassword && mPassword != passwd) {
			delete mPassword;
		}
		mPassword = passwd;

		// set new encrypted password and hash
		model->setPasswordHashed(mPassword->getKeyHashed());
		int result = 2;
		if (mGradidoKeyPair && mGradidoKeyPair->hasPrivateKey()) {
			auto encryptedPrivateKey = mGradidoKeyPair->getCryptedPrivKey(mPassword);
			model->setPrivateKey(encryptedPrivateKey);
			MemoryManager::getInstance()->releaseMemory(encryptedPrivateKey);

			result = model->updatePrivkeyAndPasswordHash();
		}
		else {
			model->updateIntoDB("password", mPassword->getKeyHashed());
		}
		// save changes to db
		return result;
	}

	int User::checkIfVerificationEmailsShouldBeResend(const Poco::Util::Timer& timer)
	{
		auto cm = ConnectionManager::getInstance();
		auto em = ErrorManager::getInstance();
		static const char* function_name = "User::checkIfVerificationEmailsShouldBeResend";

		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);
		std::vector<Poco::Tuple<int,Poco::DateTime>> results;
		select << "select u.id, v.created from users as u "
			<< "LEFT JOIN email_opt_in as v ON(u.id = v.user_id) "
			<< "where u.email_checked = 0 "
			<< "AND v.resend_count <= 1", Poco::Data::Keywords::into(results)
		;

		try {
			auto now = Poco::DateTime();
			select.execute();
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
			if(count_scheduled_at_once) printf("scheduled %d verification email resend at once\n", count_scheduled_at_once);
			if(count_scheduled) printf("scheduled %d verification email resend in the next 7 days\n", count_scheduled);
		}
		catch (Poco::Exception& ex) {
			em->addError(new ParamError(function_name, "mysql error by select", ex.displayText().data()));
			em->sendErrorsAsEmail();
			return -1;
		}
		return 0;
	}

}