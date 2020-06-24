#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE

#include "../model/table/UserBackups.h"
#include "../Crypto/KeyPair.h"
#include "../Crypto/KeyPairEd25519.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class UserBackups : public TableControllerBase
	{
	public:

		~UserBackups();

		static Poco::AutoPtr<UserBackups> create(int user_id, const std::string& passphrase, ServerConfig::Mnemonic_Types type);

		static std::vector<Poco::AutoPtr<UserBackups>> load(int user_id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::UserBackups> getModel() { return _getModel<model::table::UserBackups>(); }

		//! depracted
		//! \return create keyPair from passphrase if not exist, else return existing pointer
		Poco::SharedPtr<KeyPair> getKeyPair();

		//! \return newly created key pair from passphrase or nullptr if not possible, caller becomes owner of pointer
		KeyPairEd25519* createGradidoKeyPair();

		//! \brief adding newlines to make block format
		static std::string formatPassphrase(std::string passphrase, int targetLinesCount = 5);

		std::string getPassphrase(ServerConfig::Mnemonic_Types type);

	protected:
		UserBackups(model::table::UserBackups* dbModel);
		Poco::SharedPtr<KeyPair> mKeyPair;
		
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE