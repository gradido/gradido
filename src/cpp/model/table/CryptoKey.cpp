#include "CryptoKey.h"
#include "../../lib/DataTypeConverter.h"
using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		CryptoKey::CryptoKey()
		{

		}

		CryptoKey::CryptoKey(MemoryBin* privateKey, MemoryBin* publicKey, KeyType keyType)
			: mKeyType(keyType)
		{
			if (!privateKey) { 
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(); 
			} else {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(*privateKey, privateKey->size()));
			}

			if (!publicKey) { 
				mPublicKey = Poco::Nullable<Poco::Data::BLOB>();
			} else {
				mPublicKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(*publicKey, publicKey->size()));
			}
		}

		CryptoKey::~CryptoKey()
		{

		}

		std::string CryptoKey::toString()
		{
			assert(mKeyType < KEY_TYPE_COUNT && mKeyType >= 0);
			std::stringstream ss;
			ss << "Key Type: " << typeToString(static_cast<KeyType>(mKeyType)) << std::endl;
			ss << "Public Key: " << DataTypeConverter::binToHex(mPublicKey);
			return ss.str();
		}


		const char* CryptoKey::typeToString(KeyType type)
		{
			switch (type) {
			case KEY_TYPE_ED25519_SODIUM_ENCRYPTED: return "ed25519 sodium encrypted";
			case KEY_TYPE_ED25519_HEDERA_ENCRYPTED: return "ed22519 for hedera encrypted";
			case KEY_TYPE_ED25519_SODIUM_CLEAR: return "ed25519 sodium clear";
			case KEY_TYPE_ED25519_HEDERA_CLEAR: return "ed25519 hedera clear";
			}
			return "<unknown type>";
		}

		bool CryptoKey::hasPrivateKeyEncrypted() const
		{
			const KeyType type = (KeyType)(mKeyType);
			if (type == KEY_TYPE_ED25519_HEDERA_ENCRYPTED || type == KEY_TYPE_ED25519_SODIUM_ENCRYPTED) {
				return !mPrivateKey.isNull();
			}
			return false;
		}

		bool CryptoKey::isEncrypted() const
		{
			const KeyType type = (KeyType)(mKeyType);
			if (type == KEY_TYPE_ED25519_HEDERA_ENCRYPTED ||
				type == KEY_TYPE_ED25519_SODIUM_ENCRYPTED) {
				return true;
			}
			return false;
		}

		Poco::Data::Statement CryptoKey::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, private_key, public_key, crypto_key_type_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mPrivateKey), into(mPublicKey), into(mKeyType);

			return select;
		}

		Poco::Data::Statement CryptoKey::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where public_key = ?"
				, into(mID), use(mPublicKey);
			unlock();
			return select;
		}
	
		
		Poco::Data::Statement CryptoKey::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (private_key, public_key, crypto_key_type_id) VALUES(?,?,?)"
				, use(mPrivateKey), use(mPublicKey), use(mKeyType);
			unlock();
			return insert;
		}
	}
}