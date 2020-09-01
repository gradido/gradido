#include "KeyPairHedera.h"
#include "../lib/DataTypeConverter.h"
#include <assert.h>

#include "../SingletonManager/ErrorManager.h"

KeyPairHedera::KeyPairHedera()
	: mPrivateKey(nullptr)
{

}

KeyPairHedera::KeyPairHedera(const MemoryBin* privateKey, const unsigned char* publicKey/* = nullptr*/, size_t publicKeySize/* = 0*/)
	: mPrivateKey(nullptr)
{
	auto derPrefixPriv = DataTypeConverter::hexToBin("302e020100300506032b657004220420");
	auto derPrefixPub = DataTypeConverter::hexToBin("302a300506032b6570032100");

	auto mm = MemoryManager::getInstance();

	if (privateKey) {
		switch (privateKey->size()) {
		case 48:
			// key with prefix
			if (0 == sodium_memcmp(*privateKey, *derPrefixPriv, derPrefixPriv->size())) {
				//int crypto_sign_seed_keypair(unsigned char *pk, unsigned char *sk, const unsigned char *seed);
				auto seed = mm->getFreeMemory(crypto_sign_ed25519_SEEDBYTES);
				memcpy(*seed, privateKey->data(derPrefixPriv->size()), crypto_sign_ed25519_SEEDBYTES);
				createKeyFromSeed(seed);
				break;
			}
		case 32:
			createKeyFromSeed(privateKey);
			break;
		case 64:
			//mPrivateKey = privateKey;
			if (!mPrivateKey || mPrivateKey->size() != privateKey->size()) {
				if (mPrivateKey) {
					mm->releaseMemory(mPrivateKey);
				}
				mPrivateKey = mm->getFreeMemory(privateKey->size());
				memcpy(*mPrivateKey, *privateKey, privateKey->size());
			}
			break;
		default:
			throw std::exception("[KeyPairHedera] invalid private key");
		}

		// check public
	}
	if (publicKey) {
		switch (publicKeySize)
		{
		case 32: { // raw public key
			memcpy(mPublicKey, publicKey, publicKeySize);
			break;
		}
		case 44: // DER encoded public key
			if (0 == sodium_memcmp(publicKey, *derPrefixPub, derPrefixPub->size())) {
				memcpy(mPublicKey, &publicKey[derPrefixPub->size()], ed25519_pubkey_SIZE);
			}
			break;
		default:
			throw std::exception("[KeyPairHedera] invalid public key");
		}
	}
	auto public_key_2 = mm->getFreeMemory(ed25519_pubkey_SIZE);
	crypto_sign_ed25519_sk_to_pk(*public_key_2, *mPrivateKey);
	if (sodium_memcmp(*public_key_2, mPublicKey, ed25519_pubkey_SIZE) != 0) {
		throw "public keys not match";
	}

	mm->releaseMemory(public_key_2);
	mm->releaseMemory(derPrefixPriv);
	mm->releaseMemory(derPrefixPub);
}
KeyPairHedera::KeyPairHedera(const MemoryBin* privateKey, const MemoryBin* publicKey /* = nullptr*/)
	: KeyPairHedera(privateKey, publicKey->data(), publicKey->size())
{
	
}

KeyPairHedera::~KeyPairHedera()
{
	auto mm = MemoryManager::getInstance();
	if (mPrivateKey) {
		mm->releaseMemory(mPrivateKey);
		mPrivateKey = nullptr;
	}
}


void KeyPairHedera::createKeyFromSeed(const MemoryBin* seed)
{
	assert(seed && seed->size() == crypto_sign_ed25519_SEEDBYTES);

	auto mm = MemoryManager::getInstance();
	auto secret_key = mm->getFreeMemory(crypto_sign_SECRETKEYBYTES);
	crypto_sign_seed_keypair(mPublicKey, *secret_key, *seed);

	if (mPrivateKey) {
		mm->releaseMemory(mPrivateKey);
	}
	mPrivateKey = secret_key;

	// iroha 
	//ed25519_privkey_SIZE
	//ed25519_derive_public_key(const private_key_t* sk,public_key_t* pk); 
}

MemoryBin* KeyPairHedera::sign(const unsigned char* message, size_t messageSize) const
{
	if (!message || !messageSize) return nullptr;
	if (!mPrivateKey) return nullptr;
	auto mm = MemoryManager::getInstance();
	auto em = ErrorManager::getInstance();

	const static char functionName[] = "KeyPairHedera::sign";

	auto signBinBuffer = mm->getFreeMemory(crypto_sign_BYTES);
	unsigned long long actualSignLength = 0;

	if (crypto_sign_detached(*signBinBuffer, &actualSignLength, message, messageSize, *mPrivateKey)) {
		em->addError(new Error(functionName, "sign failed"));
		auto messageHex = DataTypeConverter::binToHex(message, messageSize);
		em->addError(new ParamError(functionName, "message as hex", messageHex));
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	if (crypto_sign_verify_detached(*signBinBuffer, message, messageSize, mPublicKey) != 0) {
		// Incorrect signature! 
		//printf("c[KeyBuffer::%s] sign verify failed\n", __FUNCTION__);
		em->addError(new Error(functionName, "sign verify failed"));
		auto messageHex = DataTypeConverter::binToHex(message, messageSize);
		em->addError(new ParamError(functionName, "message as hex", messageHex));
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	// debug
	/*const size_t hex_sig_size = crypto_sign_BYTES * 2 + 1;
	char sig_hex[hex_sig_size];
	sodium_bin2hex(sig_hex, hex_sig_size, *signBinBuffer, crypto_sign_BYTES);
	printf("[User::sign] signature hex: %s\n", sig_hex);
	*/

	return signBinBuffer;

}

bool KeyPairHedera::verify(const unsigned char* message, size_t messageSize, MemoryBin* signature) const
{
	if (crypto_sign_verify_detached(*signature, message, messageSize, mPublicKey) != 0) {
		return false;
	}
	return true;
}

MemoryBin* KeyPairHedera::getCryptedPrivKey(const Poco::AutoPtr<SecretKeyCryptography> password) const
{
	if (password.isNull()) return nullptr;
	if (!mPrivateKey) return nullptr;

	auto private_key_hex_string = DataTypeConverter::binToHex(mPrivateKey);
	printf("[KeyPairHedera::getCryptedPrivKey] private key hex: %s\n", private_key_hex_string.data());

	MemoryBin* encryptedKey = nullptr;
	if (SecretKeyCryptography::AUTH_ENCRYPT_OK == password->encrypt(mPrivateKey, &encryptedKey)) {
		auto encrypted_private_key_hex_string = DataTypeConverter::binToHex(encryptedKey);
		printf("[KeyPairHedera::getCryptedPrivKey] encryptet private key hex: %s\n", encrypted_private_key_hex_string.data());
		return encryptedKey;
	}
	else {
		return nullptr;
	}

}

MemoryBin* KeyPairHedera::getPublicKeyCopy() const
{
	auto mm = MemoryManager::getInstance();
	auto public_key = mm->getFreeMemory(ed25519_pubkey_SIZE);
	memcpy(*public_key, mPublicKey, ed25519_pubkey_SIZE);
	return public_key;
}