#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE

#include "../model/table/UserBackup.h"
#include "../Crypto/KeyPairEd25519.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class UserBackup : public TableControllerBase
	{
	public:

		~UserBackup();

		static Poco::AutoPtr<UserBackup> create(int user_id, const std::string& passphrase, ServerConfig::Mnemonic_Types type);

		static std::vector<Poco::AutoPtr<UserBackup>> load(int user_id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::UserBackup> getModel() { return _getModel<model::table::UserBackup>(); }

		//! depracted
		//! \return create keyPair from passphrase if not exist, else return existing pointer
		Poco::SharedPtr<KeyPairEd25519> getKeyPair();

		//! \return newly created key pair from passphrase or nullptr if not possible, caller becomes owner of pointer
		KeyPairEd25519* createGradidoKeyPair();

		//! \brief adding newlines to make block format
		static std::string formatPassphrase(std::string passphrase, int targetLinesCount = 5);

		std::string getPassphrase(ServerConfig::Mnemonic_Types type);

	protected:
		UserBackup(model::table::UserBackup* dbModel);
		Poco::SharedPtr<KeyPairEd25519> mKeyPair;
		
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE