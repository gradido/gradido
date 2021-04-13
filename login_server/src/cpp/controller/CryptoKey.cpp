
#include "CryptoKey.h"
#include "../SingletonManager/ErrorManager.h"
#include "../lib/DataTypeConverter.h"

namespace controller {

	CryptoKey::CryptoKey(model::table::CryptoKey* dbModel)
	{
		mDBModel = dbModel;
	}

	CryptoKey::~CryptoKey()
	{

	}

	Poco::AutoPtr<CryptoKey> CryptoKey::create(const KeyPairHedera* hederaKeyPair, Poco::AutoPtr<controller::User> user, bool saveEncrypted/* = true*/)
	{
		auto mm = MemoryManager::getInstance();

		MemoryBin* private_key = nullptr;
		auto public_key = hederaKeyPair->getPublicKeyCopy();

		model::table::KeyType key_type;
		if (saveEncrypted) {
			key_type = model::table::KEY_TYPE_ED25519_HEDERA_ENCRYPTED;
			private_key = hederaKeyPair->getCryptedPrivKey(user->getPassword());
		}
		else {
			key_type = model::table::KEY_TYPE_ED25519_HEDERA_CLEAR;
			private_key = hederaKeyPair->getPrivateKeyCopy();
		}
		auto db = new model::table::CryptoKey(private_key, public_key, key_type);

		mm->releaseMemory(private_key);
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

	std::unique_ptr<KeyPairHedera> CryptoKey::getKeyPair(Poco::AutoPtr<controller::User> user) const
	{
		auto model = getModel();
		assert(model);

		if (!model->isEncrypted()) {
			return getKeyPair();
		}

		if (!model->hasPrivateKey()) {
			printf("[CryptoKey::getKeyPair] return null, no private key\n");
			return nullptr;
		}

		auto password = user->getPassword();
		auto mm = MemoryManager::getInstance();
		if (!password) {
			printf("[CryptoKey::getKeyPair] return null, password empty\n");
		}
		MemoryBin* clearPrivateKey = nullptr;
		auto encrypted_private_key = model->getPrivateKey();
		//auto encrypted_private_key_hex_string = DataTypeConverter::binToHex(encrypted_private_key);
		//printf("[CryptoKey::getKeyPair] encrypted private key hex: %s\n", encrypted_private_key_hex_string.data());
		if (password->decrypt(model->getPrivateKey(), &clearPrivateKey) != SecretKeyCryptography::AUTH_DECRYPT_OK) {
			printf("[CryptoKey::getKeyPair] return null, error decrypting\n");
			return nullptr;
		}
		auto key_pair = std::make_unique<KeyPairHedera>(clearPrivateKey->data(), clearPrivateKey->size(), model->getPublicKey(), model->getPublicKeySize());
		mm->releaseMemory(clearPrivateKey);
		return key_pair;
	}

	std::unique_ptr<KeyPairHedera> CryptoKey::getKeyPair() const
	{
		auto model = getModel();
		assert(model);
		if (!model->hasPrivateKey() || model->isEncrypted()) {
			printf("[CryptoKey::getKeyPair] no private key or encrypted\n");
			return nullptr;
		}
		
		
		return std::make_unique<KeyPairHedera>(model->getPrivateKey(), model->getPublicKey(), model->getPublicKeySize());
	}

	bool CryptoKey::changeEncryption(Poco::AutoPtr<controller::User> user)
	{
		auto key_pair = getKeyPair(user);
		if (!key_pair || !key_pair->hasPrivateKey()) {
			addError(new Error("Crypto Key", "key pair or private key was null"));
			return false;
		}
		auto model = getModel();
		auto mm = MemoryManager::getInstance();
		// update key type 
		model->changeKeyTypeToggleEncrypted();
		MemoryBin* private_key = nullptr;
		if (model->isEncrypted()) {
			private_key = key_pair->getCryptedPrivKey(user->getPassword());
		}
		else {
			private_key = key_pair->getPrivateKeyCopy();
		}
		if (!private_key) {
			addError(new Error("Crypto Key", " private_key not get"));
			return false;
		}
		model->setPrivateKey(private_key);
		// save changes into db
		model->updatePrivkeyAndKeyType();

		mm->releaseMemory(private_key);
		return true;
	}
}

