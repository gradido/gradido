#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_CRYPTO_KEYS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_CRYPTO_KEYS_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"

namespace model {
	namespace table {

		enum KeyType {
			KEY_TYPE_SODIUM_ED25519 = 0,
			KEY_TYPE_ED25519_REF10 = 1,
			KEY_TYPE_COUNT
		};

		class CryptoKey : public ModelBase
		{
		public:
			CryptoKey();
			~CryptoKey();

			// generic db operations
			const char* getTableName() const { return "crypto_keys"; }
			std::string toString();


			static const char* typeToString(KeyType type);
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::Nullable<Poco::Data::BLOB> mPrivateKey;
			Poco::Nullable<Poco::Data::BLOB> mPublicKey;
			int mKeyType;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_CRYPTO_KEYS_INCLUDE