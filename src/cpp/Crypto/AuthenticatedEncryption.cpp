#include "AuthenticatedEncryption.h"

#include "sodium.h"
#include "../ServerConfig.h"
#include <assert.h>

AuthenticatedEncryption::AuthenticatedEncryption()
	: mOpsLimit(10), mMemLimit(33554432), mAlgo(2), mEncryptionKey(nullptr), mEncryptionKeyHash(0)
{
}

AuthenticatedEncryption::AuthenticatedEncryption(unsigned long long opslimit, size_t memlimit, int algo)
	: mOpsLimit(opslimit), mMemLimit(memlimit), mAlgo(algo), mEncryptionKey(nullptr), mEncryptionKeyHash(0)
{

}

AuthenticatedEncryption::~AuthenticatedEncryption()
{
	if (mEncryptionKey) {
		MemoryManager::getInstance()->releaseMemory(mEncryptionKey);
		mEncryptionKey = nullptr;
	}
}

AuthenticatedEncryption::ResultType AuthenticatedEncryption::createKey(const std::string& salt_parameter, const std::string& passwd)
{
	assert(crypto_hash_sha512_BYTES >= crypto_pwhash_SALTBYTES);
		
	auto mm = MemoryManager::getInstance();
	auto app_secret = ServerConfig::g_CryptoAppSecret;

	assert(app_secret);

	std::unique_lock<std::shared_mutex> _lock(mWorkingMutex);
	
	// use hash512 because existing data where calculated with that, but could be also changed to hash256
	auto hash512_salt = mm->getFreeMemory(crypto_hash_sha512_BYTES); // need at least crypto_pwhash_SALTBYTES 16U

	crypto_hash_sha512_state state;
	crypto_hash_sha512_init(&state);
	//crypto_hash_sha512_update
	crypto_hash_sha512_update(&state, (const unsigned char*)salt_parameter.data(), salt_parameter.size());
	crypto_hash_sha512_update(&state, *app_secret, app_secret->size());
	crypto_hash_sha512_final(&state, *hash512_salt);


	//unsigned char* key = (unsigned char *)malloc(crypto_box_SEEDBYTES); // 32U
	//ObfusArray* key = new ObfusArray(crypto_box_SEEDBYTES);
	if (!mEncryptionKey) {
		mEncryptionKey = mm->getFreeMemory(crypto_box_SEEDBYTES);
	}
	//Bin32Bytes* key = mm->get32Bytes();

	// generate encryption key, should take a bit longer to make brute force attacks hard
	if (crypto_pwhash(*mEncryptionKey, mEncryptionKey->size(), passwd.data(), passwd.size(), *hash512_salt, mOpsLimit, mMemLimit, mAlgo) != 0) {
		mm->releaseMemory(mEncryptionKey); 
		mEncryptionKey = nullptr;

		return AUTH_CREATE_ENCRYPTION_KEY_FAILED;
	}

	// generate hash from key for compare
	assert(sizeof(KeyHashed) >= crypto_shorthash_BYTES);
	assert(ServerConfig::g_ServerCryptoKey);
	crypto_shorthash((unsigned char*)&mEncryptionKeyHash, *mEncryptionKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);

	return AUTH_ENCRYPT_OK;
}

AuthenticatedEncryption::ResultType AuthenticatedEncryption::encrypt(const MemoryBin* message, MemoryBin** encryptedMessage) const
{
	assert(message && encryptedMessage);
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);

	if (!mEncryptionKey) {
		return AUTH_NO_KEY;
	}
	
	size_t message_len = message->size();
	size_t ciphertext_len = crypto_secretbox_MACBYTES + message_len;

	unsigned char nonce[crypto_secretbox_NONCEBYTES];
	// we use a hardcoded value for nonce
	// TODO: use a dynamic value, save it along with the other parameters
	memset(nonce, 31, crypto_secretbox_NONCEBYTES);

	auto mm = MemoryManager::getInstance();
	auto ciphertext = mm->getFreeMemory(ciphertext_len);
	memset(*ciphertext, 0, ciphertext_len);

	if (0 != crypto_secretbox_easy(*ciphertext, *message, message_len, nonce, *mEncryptionKey)) {
		mm->releaseMemory(ciphertext);

		return AUTH_ENCRYPT_MESSAGE_FAILED;
	}

	*encryptedMessage = ciphertext;

	return AUTH_ENCRYPT_OK;
}

AuthenticatedEncryption::ResultType AuthenticatedEncryption::decrypt(const unsigned char* encryptedMessage, size_t encryptedMessageSize, MemoryBin** message) const
{
	assert(message);
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);

	if (!mEncryptionKey) {
		return AUTH_NO_KEY;
	}

	size_t decryptSize = encryptedMessageSize - crypto_secretbox_MACBYTES;
	//unsigned char* decryptBuffer = (unsigned char*)malloc(decryptSize);
	auto mm = MemoryManager::getInstance();
	//ObfusArray* decryptedData = new ObfusArray(decryptSize);
	auto decryptedData = mm->getFreeMemory(decryptSize);
	unsigned char nonce[crypto_secretbox_NONCEBYTES];
	// we use a hardcoded value for nonce
	// TODO: use a dynamic value, save it along with the other parameters
	memset(nonce, 31, crypto_secretbox_NONCEBYTES);

	if (crypto_secretbox_open_easy(*decryptedData, encryptedMessage, encryptedMessageSize, nonce, *mEncryptionKey)) {
		mm->releaseMemory(decryptedData);
		return AUTH_DECRYPT_MESSAGE_FAILED;
	}
	*message = decryptedData;

	return AUTH_DECRYPT_OK;
}

const char* AuthenticatedEncryption::getErrorMessage(ResultType type)
{
	switch (type) {
	case AUTH_ENCRYPT_OK: return "everything is ok";
	//case AUTH_ENCRYPT_SHA2_TO_SMALL: return "libsodium crypto_hash_sha512_BYTES is to small to use as crypto_pwhash_SALTBYTES";
	case AUTH_CREATE_ENCRYPTION_KEY_FAILED: return "error creating encryption key, maybe to much memory requested?";
	case AUTH_NO_KEY: return "no encryption key generated";
	case AUTH_ENCRYPT_MESSAGE_FAILED: return "message encryption failed";
	case AUTH_DECRYPT_MESSAGE_FAILED: return "message decryption failed";
	}
	return "<unknown>";
}