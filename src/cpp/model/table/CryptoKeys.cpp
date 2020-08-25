#include "CryptoKeys.h"
#include "../../lib/DataTypeConverter.h"
using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		CryptoKeys::CryptoKeys()
		{

		}

		CryptoKeys::~CryptoKeys()
		{

		}

		std::string CryptoKeys::toString()
		{
			assert(mKeyType < KEY_TYPE_COUNT && mKeyType >= 0);
			std::stringstream ss;
			ss << "Key Type: " << typeToString(static_cast<KeyType>(mKeyType)) << std::endl;
			ss << "Public Key: " << DataTypeConverter::binToHex(mPublicKey);
			return ss.str();
		}


		const char* CryptoKeys::typeToString(KeyType type)
		{
			switch (type) {
			case KEY_TYPE_ED25519_REF10: return "ed25519 ref10";
			case KEY_TYPE_SODIUM_ED25519: return "sodium ed22519";
			}
			return "<unknown type>";
		}

		Poco::Data::Statement CryptoKeys::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, private_key, public_key, crypto_key_type_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mPrivateKey), into(mPublicKey), into(mKeyType);

			return select;
		}

		Poco::Data::Statement CryptoKeys::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where public_key = ?"
				, into(mID), use(mPublicKey);
			unlock();
			return select;
		}
	
		
		Poco::Data::Statement CryptoKeys::_insertIntoDB(Poco::Data::Session session)
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