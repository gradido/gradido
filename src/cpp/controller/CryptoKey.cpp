
#include "CryptoKey.h"
#include "../SingletonManager/ErrorManager.h"

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

	Poco::AutoPtr<CryptoKey> CryptoKey::load(MemoryBin* publicKey)
	{
		return load(*publicKey, publicKey->size());
	}

	Poco::AutoPtr<CryptoKey> CryptoKey::load(const unsigned char* publicKey, size_t size)
	{
		assert(publicKey);
		assert(size);

		Poco::Data::BLOB public_key_blob(publicKey, size);
		auto db = new model::table::CryptoKey();
		auto count = db->loadFromDB<Poco::Data::BLOB>("public_key", public_key_blob);
		if (!count) return nullptr;
		if (1 == count) return new CryptoKey(db);

		auto em = ErrorManager::getInstance();
		em->addError(new Error("CryptoKey::load", "found more than one crypto key with same public key"));
		em->sendErrorsAsEmail();
		return nullptr;
	}

	KeyPairHedera* CryptoKey::getKeyPair(Poco::AutoPtr<controller::User> user)
	{
		auto model = getModel();
		auto password = user->getPassword();
		auto mm = MemoryManager::getInstance();
		if (!password || !model->hasPrivateKeyEncrypted()) {
			return nullptr;
		}
		MemoryBin* clearPassword = nullptr;
		if (password->decrypt(model->getPrivateKeyEncrypted(), &clearPassword) != SecretKeyCryptography::AUTH_DECRYPT_OK) {
			return nullptr;
		}
		KeyPairHedera* key_pair = new KeyPairHedera(clearPassword, model->getPublicKey(), model->getPublicKeySize());
		mm->releaseMemory(clearPassword);
		return key_pair;
	}


}

