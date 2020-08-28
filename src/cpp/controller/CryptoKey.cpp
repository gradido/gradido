
#include "CryptoKey.h"

namespace controller {

	CryptoKey::CryptoKey(model::table::CryptoKey* dbModel)
	{
		mDBModel = dbModel;
	}

	CryptoKey::~CryptoKey()
	{

	}

	Poco::AutoPtr<CryptoKey> CryptoKey::create(const KeyPairHedera* hederaKeyPair, Poco::AutoPtr<controller::User> user)
	{
		auto mm = MemoryManager::getInstance();

		auto encrypted_priv_key = hederaKeyPair->getCryptedPrivKey(user->getPassword());
		auto public_key = hederaKeyPair->getPublicKeyCopy();

		auto db = new model::table::CryptoKey(encrypted_priv_key, public_key, model::table::KEY_TYPE_ED25519_HEDERA);

		mm->releaseMemory(encrypted_priv_key);
		mm->releaseMemory(public_key);

		auto cryptoKey = new CryptoKey(db);
		return Poco::AutoPtr<CryptoKey>(cryptoKey);
	}

	Poco::AutoPtr<CryptoKey> CryptoKey::load(int id)
	{
		auto db = new model::table::CryptoKey();
		if (1 == db->loadFromDB("id", id)) {
			auto cryptoKey = new CryptoKey(db);
			return Poco::AutoPtr<CryptoKey>(cryptoKey);
		}
		return nullptr;
	}


}

