#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR
#define GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR

#include "Obfus_array.h"
#include "mnemonic.h"

#include "ed25519/ed25519.h"
#include <sodium.h>

class KeyPair 
{
public:
	KeyPair();
	~KeyPair();

	bool generateFromPassphrase(const char* passphrase, Mnemonic* word_source);

protected:

private:
	ObfusArray* mPrivateKey;
	ObfusArray* mSodiumSecret;
	unsigned char mPublicKey[ed25519_pubkey_SIZE];
	unsigned char mSodiumPublic[crypto_sign_PUBLICKEYBYTES];
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR