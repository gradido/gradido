#include "KeyPair.h"

#include <memory.h>
#include <string.h>

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/ConnectionManager.h"

using namespace Poco::Data::Keywords;


#define STR_BUFFER_SIZE 25

KeyPair::KeyPair()
	: mPrivateKey(nullptr), mSodiumSecret(nullptr)
{

}

KeyPair::~KeyPair()
{
	if (mPrivateKey) {
		delete mPrivateKey;
	}
	if (mSodiumSecret) {
		delete mSodiumSecret;
	}
}

bool KeyPair::generateFromPassphrase(const char* passphrase, Mnemonic* word_source)
{

	// libsodium doc: https://libsodium.gitbook.io/doc/advanced/hmac-sha2
	// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
	//crypto_auth_hmacsha512_keygen
	unsigned long word_indices[PHRASE_WORD_COUNT];

	//DHASH key = DRMakeStringHash(passphrase);
	size_t pass_phrase_size = strlen(passphrase);
	char acBuffer[STR_BUFFER_SIZE]; memset(acBuffer, 0, STR_BUFFER_SIZE);
	size_t buffer_cursor = 0;
	// get word indices for hmac key
	unsigned char word_cursor = 0;
	for (size_t i = 0; i < pass_phrase_size; i++) {
		if (passphrase[i] == ' ') {
			word_indices[word_cursor] = word_source->getWordIndex(acBuffer);

			word_cursor++;
			memset(acBuffer, 0, STR_BUFFER_SIZE);
			buffer_cursor = 0;
		}
		else {
			acBuffer[buffer_cursor++] = passphrase[i];
		}

	}
	sha_context state;

	unsigned char hash[SHA_512_SIZE];
	//crypto_auth_hmacsha512_state state;
	size_t word_index_size = sizeof(word_indices);
	//crypto_auth_hmacsha512_init(&state, (unsigned char*)word_indices, sizeof(word_indices));
	sha512_init(&state);
	sha512_update(&state, (unsigned char*)word_indices, sizeof(word_indices));
	sha512_update(&state, (unsigned char*)passphrase, pass_phrase_size);
	//crypto_auth_hmacsha512_update(&state, (unsigned char*)passphrase, pass_phrase_size);
	sha512_final(&state, hash);
	//crypto_auth_hmacsha512_final(&state, hash);
	

	//ed25519_create_keypair(public_key, private_key, hash);
	private_key_t prv_key_t;
	memcpy(prv_key_t.data, hash, 32);
	public_key_t pbl_key_t;
	ed25519_derive_public_key(&prv_key_t, &pbl_key_t);


	//memcpy(private_key, prv_key_t.data, 32);
	if (mPrivateKey) {
		delete mPrivateKey;
	}
	mPrivateKey = new ObfusArray(ed25519_privkey_SIZE, prv_key_t.data);
	memcpy(mPublicKey, pbl_key_t.data, ed25519_pubkey_SIZE);

	unsigned char sodium_secret[crypto_sign_SECRETKEYBYTES];

	crypto_sign_seed_keypair(mSodiumPublic, sodium_secret, *mPrivateKey);
	
	if(mSodiumSecret) {
		delete mSodiumSecret;
	}
	mSodiumSecret = new ObfusArray(crypto_sign_SECRETKEYBYTES, sodium_secret);

	// using 
	return true;
}

std::string KeyPair::getPubkeyHex()
{
	size_t hexSize = crypto_sign_PUBLICKEYBYTES * 2 + 1;
	char* hexString = (char*)malloc(hexSize);
	memset(hexString, 0, hexSize);
	sodium_bin2hex(hexString, hexSize, mSodiumPublic, crypto_sign_PUBLICKEYBYTES);
	std::string pubHex = hexString;
	free(hexString);

	return pubHex;
}

bool KeyPair::savePrivKey(int userId)
{
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	Poco::Data::Statement update(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));
	Poco::Data::BLOB privkey_blob((const unsigned char*)(*mPrivateKey), mPrivateKey->size());

	update << "UPDATE users set privkey = ? where id = ?",
		use(privkey_blob), use(userId);
		
	try {
		if (update.execute() != 1) {
			em->addError(new ParamError("KeyPair::savePrivKey", "error writing privkey, user not found? ", std::to_string(userId)));
			em->sendErrorsAsEmail();
			return false;
		}
	} catch (Poco::Exception& ex) {
		em->addError(new ParamError("KeyPair::savePrivKey", "exception by running mysql", ex.displayText()));
		em->sendErrorsAsEmail();
		return false;
	}
	return true;
}