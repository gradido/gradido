#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR
#define GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR

#include "Obfus_array.h"
#include "../SingletonManager/MemoryManager.h"
#include "mnemonic.h"

#include "ed25519/ed25519.h"
#include <sodium.h>



class UserWriteKeysIntoDB;
class UserGenerateKeys;
// TODO: https://libsodium.gitbook.io/doc/advanced/ed25519-curve25519
class KeyPair 
{
	friend UserWriteKeysIntoDB;
	friend UserGenerateKeys;
public:
	KeyPair();
	~KeyPair();

	bool generateFromPassphrase(const char* passphrase, Mnemonic* word_source);
	static std::string filterPassphrase(const std::string& passphrase);
	std::string getPubkeyHex();
	bool savePrivKey(int userId);
	static std::string getHex(const unsigned char* data, Poco::UInt32 size);
	
	inline const unsigned char* getPublicKey() const { return mSodiumPublic; }

protected:
	const MemoryBin* getPrivateKey() const { return mSodiumSecret; }

	

private:
	// 32 Byte
	MemoryBin* mPrivateKey;
	// 64 Byte
	MemoryBin* mSodiumSecret;
	// 32 Byte
	unsigned char mPublicKey[ed25519_pubkey_SIZE];
	// 32 Byte
	unsigned char mSodiumPublic[crypto_sign_PUBLICKEYBYTES];
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR