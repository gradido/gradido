#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR
#define GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR

#include "Obfus_array.h"
#include "mnemonic.h"

#include "ed25519/ed25519.h"
#include <sodium.h>

class UserWriteKeysIntoDB;

class KeyPair 
{
	friend UserWriteKeysIntoDB;
public:
	KeyPair();
	~KeyPair();

	bool generateFromPassphrase(const char* passphrase, Mnemonic* word_source);
	std::string getPubkeyHex();
	bool savePrivKey(int userId);

	
	inline const unsigned char* getPublicKey() const { return mSodiumPublic; }

protected:
	const ObfusArray* getPrivateKey() const { return mSodiumSecret; }

private:
	ObfusArray* mPrivateKey;
	ObfusArray* mSodiumSecret;
	unsigned char mPublicKey[ed25519_pubkey_SIZE];
	unsigned char mSodiumPublic[crypto_sign_PUBLICKEYBYTES];
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR