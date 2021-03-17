#include "CryptoKey.h"

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

		void CryptoKey::setPrivateKey(const MemoryBin* privateKey)
		{
			if (!privateKey) {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>();
			}
			else {
				mPrivateKey = Poco::Nullable<Poco::Data::BLOB>(Poco::Data::BLOB(*privateKey, privateKey->size()));
			}

		}

		bool CryptoKey::changeKeyTypeToggleEncrypted()
		{
			const KeyType type = (KeyType)(mKeyType);
			if (type == KEY_TYPE_ED25519_SODIUM_ENCRYPTED) {
				mKeyType = KEY_TYPE_ED25519_SODIUM_CLEAR;
				return true;
			}
			if (type == KEY_TYPE_ED25519_HEDERA_ENCRYPTED) {
				mKeyType = KEY_TYPE_ED25519_HEDERA_CLEAR;
				return true;
			}
			if (type == KEY_TYPE_ED25519_SODIUM_CLEAR) {
				mKeyType = KEY_TYPE_ED25519_SODIUM_ENCRYPTED;
				return true;
			}
			if (type == KEY_TYPE_ED25519_HEDERA_CLEAR) {
				mKeyType = KEY_TYPE_ED25519_HEDERA_ENCRYPTED;
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
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			
			select << "SELECT id FROM " << getTableName()
				<< " where public_key = ?"
				, into(mID), use(mPublicKey);
			return select;
		}
	
		
		Poco::Data::Statement CryptoKey::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			insert << "INSERT INTO " << getTableName()
				<< " (private_key, public_key, crypto_key_type_id) VALUES(?,?,?)"
				, use(mPrivateKey), use(mPublicKey), use(mKeyType);
			return insert;
		}

		size_t CryptoKey::updatePrivkeyAndKeyType()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mPrivateKey.isNull() || !mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE " << getTableName() << " SET private_key = ?, crypto_key_type_id = ? where id = ?;",
				use(mPrivateKey), use(mKeyType), use(mID);


			size_t resultCount = 0;
			try {
				return update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updatePrivkeyAndKeyType] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return 0;
		}

	}
}