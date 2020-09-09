#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_CRYPTO_KEY_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_CRYPTO_KEY_INCLUDE

#include "../model/table/CryptoKey.h"
#include "../Crypto/KeyPairHedera.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"
#include "User.h"

namespace controller {
	class CryptoKey : public TableControllerBase
	{
	public:

		~CryptoKey();

		static Poco::AutoPtr<CryptoKey> create(const KeyPairHedera* hederaKeyPair, Poco::AutoPtr<controller::User> user, bool saveEncrypted = true);

		//! if returned ptr is NULL, dataset not found
		static Poco::AutoPtr<CryptoKey> load(int id);
		static Poco::AutoPtr<CryptoKey> load(MemoryBin* publicKey);
		static Poco::AutoPtr<CryptoKey> load(const unsigned char* publicKey, size_t size);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::CryptoKey> getModel() { return _getModel<model::table::CryptoKey>(); }
		inline const model::table::CryptoKey* getModel() const { return _getModel<model::table::CryptoKey>(); }

		std::unique_ptr<KeyPairHedera> getKeyPair(Poco::AutoPtr<controller::User> user) const;
		std::unique_ptr<KeyPairHedera> getKeyPair() const;


	protected:
		CryptoKey(model::table::CryptoKey* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_CRYPTO_KEY_INCLUDE