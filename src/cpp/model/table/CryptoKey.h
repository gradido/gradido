#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_CRYPTO_KEYS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_CRYPTO_KEYS_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"
#include "../../lib/DataTypeConverter.h"

namespace model {
	namespace table {

		enum KeyType {
			KEY_TYPE_ED25519_SODIUM_ENCRYPTED = 0,
			KEY_TYPE_ED25519_HEDERA_ENCRYPTED = 1,
			KEY_TYPE_ED25519_SODIUM_CLEAR = 2,
			KEY_TYPE_ED25519_HEDERA_CLEAR = 3,
			KEY_TYPE_COUNT
		};

		class CryptoKey : public ModelBase
		{
		public:
			CryptoKey();
			CryptoKey(MemoryBin* privateKey, MemoryBin* publicKey, KeyType keyType);
			~CryptoKey();

			// generic db operations
			const char* getTableName() const { return "crypto_keys"; }
			std::string toString();

			inline const unsigned char* getPublicKey() const { if (mPublicKey.isNull()) return nullptr; return mPublicKey.value().content().data(); }
			inline std::string getPublicKeyHexString() const { return DataTypeConverter::binToHex(mPublicKey); };
			size_t getPublicKeySize() const { if (mPublicKey.isNull()) return 0; return mPublicKey.value().content().size(); }

			bool hasPrivateKeyEncrypted() const;
			bool isEncrypted() const;
			bool changeKeyTypeToggleEncrypted();
			inline bool hasPrivateKey() const { return !mPrivateKey.isNull(); }
			inline const std::vector<unsigned char>& getPrivateKey() const { return mPrivateKey.value().content(); }

			size_t updatePrivkeyAndKeyType();

			//! \brief set encrypted private key
			//! \param privateKey copy data, didn't move memory bin
			void setPrivateKey(const MemoryBin* privateKey);

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