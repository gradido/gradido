#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE

#include "../model/table/User.h"
//#include "../Crypto/AuthenticatedEncryption.h"
#include "../Crypto/KeyPairEd25519.h"

#include <shared_mutex>

#include "TableControllerBase.h"


namespace controller {

	/*enum UserLoadedRole {
		USER_ROLE_NOT_LOADED,
		USER_ROLE_CURRENTLY_LOADING,
		USER_ROLE_NONE,
		USER_ROLE_ADMIN
	};*/

	class User : public TableControllerBase
	{
	public:

		~User();

		static Poco::AutoPtr<User> create();
		static Poco::AutoPtr<User> create(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed = 0, std::string languageKey = "de");

		static std::vector<User*> search(const std::string& searchString);

		//! \brief go through whole db and search users with email_checked = false and schedule resend 7 days after email_opt_in created date
		//! 
		//! Should be only called by server start, later it aren't necessary, because register function schedule resend tasks by himself.
		//! By users which has registered long time ago and haven't activated there account and haven't get a second email send verification email with duration at once
		// TODO: instead scheduling all, scheduling only for next day and run this function every day (own task for that)
		static int checkIfVerificationEmailsShouldBeResend(const Poco::Util::Timer& timer);

		//! \brief try to find correct passphrase for this user from db
		//! 
		//! select entries from user_backups db table belonging to user
		//! calculate resulting public key 
		//! compare with public key from user
		//! 
		//! \return -1 no matching entry found
		//! \return -2 user id invalid or net set
		//! \return  0 matching entry found
		int tryLoadPassphraseUserBackup(KeyPairEd25519** createdKeyPair = nullptr);

		inline size_t load(const std::string& email) { return getModel()->loadFromDB("email", email); }
		//! \brief try to load user from db via user_id
		//! \return count of found rows, should be 1 or 0
		inline size_t load(int user_id) { return getModel()->loadFromDB("id", user_id); }
		int load(const unsigned char* pubkey_array);
		Poco::JSON::Object getJson();

		inline Poco::AutoPtr<model::table::User> getModel() { return _getModel<model::table::User>(); }
		inline const model::table::User* getModel() const { return _getModel<model::table::User>(); }

		std::string getEmailWithNames();
		const std::string& getPublicHex();

		//! \brief check if password match saved password, long duration, load Key pair
		//! \return 1 logged in
		//! \return 2 already logged in
		//! \return 0 password didn't match
		//! \return -1 error saved public key didn't match with private key
		//! \return -2 error decrypting private key
		//! \return -3 password key creation already running
		//! - create authenticated encryption key from password and email
		//! - compare hash with in db saved hash
		
		int login(const std::string& password);
		
		// ***********************************************************************************
		// password related
		//! \brief set authenticated encryption and save hash in db, also re encrypt private key if exist
		//! \param passwd take owner ship 
		//! \return 0 = new and current passwords are the same
		//! \return 1 = password changed, private key re-encrypted and saved into db
		//! \return 2 = password changed, only hash stored in db, couldn't load private key for re-encryption
		//! \return -1 = stored pubkey and private key didn't match
		int setNewPassword(Poco::AutoPtr<AuthenticatedEncryption> passwd);


		//! \brief set authenticated encryption and save hash in db, also re encrypt private key if exist
		//! \param password as string
		//! \return 0 = new and current passwords are the same
		//! \return 1 = password changed, private key re-encrypted and saved into db
		//! \return 2 = password changed, only hash stored in db, couldn't load private key for re-encryption
		//! \return -1 = stored pubkey and private key didn't match
		int setNewPassword(const std::string& password);

		//! \brief return AuthenticatedEncryption Auto Pointer
		inline const Poco::AutoPtr<AuthenticatedEncryption> getPassword() {
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return mPassword;
		}
		inline bool hasPassword() {
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return !mPassword.isNull();
		}
		inline bool canDecryptPrivateKey() {
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return mCanDecryptPrivateKey;
		}
		inline bool hasPublicKey() {
			return getModel()->getPublicKey();
		}
		//! \brief set key pair, public in model, private if password exist else with next setPassword call into model, overwrite existing key pair, not saving into db
		//! \param gradidoKeyPair take owner ship
		//! \param return 0 if public key set
		//! \param return 1 if also private key set (and password exist)
		int setGradidoKeyPair(KeyPairEd25519* gradidoKeyPair);

		//! \brief return gradido key pair pointer, !!! make sure controller::user stay alive while using it
		inline const KeyPairEd25519* getGradidoKeyPair() {
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return mGradidoKeyPair;
		}

		inline void setBalance(int gradidoBalance) { std::unique_lock<std::shared_mutex> _lock(mSharedMutex); mGradidoCurrentBalance = gradidoBalance; }
		inline int getBalance() { std::shared_lock<std::shared_mutex> _lock(mSharedMutex); return mGradidoCurrentBalance; }
		
	protected:

		User(model::table::User* dbModel);
				
		std::string mPublicHex;

	 	Poco::AutoPtr<AuthenticatedEncryption> mPassword;
		KeyPairEd25519*          mGradidoKeyPair;

		bool					 mCanDecryptPrivateKey;

		//! get this from community-server, later maybe from gradido-node
		//! use it for showing balance in menu in check transaction
		int					     mGradidoCurrentBalance;

		mutable std::shared_mutex mSharedMutex;
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE