#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE

#include "../model/table/UserBackups.h"
#include "../Crypto/KeyPair.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class UserBackups : public TableControllerBase
	{
	public:

		~UserBackups();

		static Poco::AutoPtr<UserBackups> create(int user_id, const std::string& passphrase);

		static std::vector<Poco::AutoPtr<UserBackups>> load(int user_id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::UserBackups> getModel() { return _getModel<model::table::UserBackups>(); }

		//! \return create keyPair from passphrase if not exist, else return existing pointer
		Poco::SharedPtr<KeyPair> getKeyPair();
		std::string getPassphrase(ServerConfig::Mnemonic_Types type);

	protected:
		UserBackups(model::table::UserBackups* dbModel);
		Poco::SharedPtr<KeyPair> mKeyPair;
		
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE