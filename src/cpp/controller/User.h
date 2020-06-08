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

		inline size_t load(const std::string& email) { return getModel()->loadFromDB("email", email); }
		inline size_t load(int user_id) { return getModel()->loadFromDB("id", user_id); }
		int load(const unsigned char* pubkey_array);
		Poco::JSON::Object getJson();

		inline Poco::AutoPtr<model::table::User> getModel() { return _getModel<model::table::User>(); }
		inline const model::table::User* getModel() const { return _getModel<model::table::User>(); }

		std::string getEmailWithNames();
		const std::string& getPublicHex();

		
		// ***********************************************************************************
		// password related
		//! \brief set authenticated encryption and save hash in db, should also re encrypt private key if exist
		//! \param passwd take owner ship 
		//! \return 0 = new and current passwords are the same
		//! \return 1 = password changed, private key re-encrypted and saved into db
		//! \return -1 = stored pubkey and private key didn't match
		int setPassword(AuthenticatedEncryption* passwd); 

		inline const AuthenticatedEncryption* getPassword() {
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return mPassword;
		}
	protected:
		User(model::table::User* dbModel);
		
		std::string mPublicHex;

		AuthenticatedEncryption* mPassword;
		KeyPairEd25519*          mGradidoKeyPair;

		mutable std::shared_mutex mSharedMutex;
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE