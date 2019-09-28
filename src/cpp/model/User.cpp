#include "User.h"
#include <sodium.h>
#include "ed25519/ed25519.h"
#include "Poco/Util/Application.h"
#include "../ServerConfig.h"

NewUser::NewUser(User* user, const char* password, const char* passphrase)
	: mUser(user), mPassword(password), mPassphrase(passphrase)
{

}


NewUser::~NewUser()
{

}

void NewUser::run() 
{
	// create crypto key
	if (!mUser->hasCryptoKey()) {
		mUser->createCryptoKey(mPassword.data());
	}

	// generate 
}


// ------------------------------------------------------------------------------------

LoginUser::LoginUser(User* user, const char* password)
	: mUser(user), mPassword(password)
{
//	auto app = Poco::Util::Application::instance();
}

LoginUser::~LoginUser()
{

}

void LoginUser::run() 
{

}

// -------------------------------------------------------------------------------------------------

int UserCreateCryptoKey::run() 
{
	mUser->createCryptoKey(mPassword);
	printf("crypto key created\n");
	return 0;
}

// -----------------------------------------------------------------------------------------------------

int UserWriteIntoDB::run()
{
	return 0;
}

// *******************************************************************************


User::User(const char* email, const char* name)
	: mEmail(email), mFirstName(name), mCryptoKey(nullptr)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
}


User::~User()
{
	if (mCryptoKey) {
		delete mCryptoKey;
	}
}


std::string User::generateNewPassphrase(Mnemonic* word_source)
{
	unsigned int random_indices[PHRASE_WORD_COUNT];
	unsigned int str_sizes[PHRASE_WORD_COUNT];
	unsigned int phrase_buffer_size = 0;

	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		random_indices[i] = randombytes_random() % 2048;
		str_sizes[i] = strlen(word_source->getWord(random_indices[i]));
		phrase_buffer_size += str_sizes[i];
	}
	phrase_buffer_size += PHRASE_WORD_COUNT + 1;

	std::string phrase_buffer(phrase_buffer_size, '\0');
	int phrase_buffer_cursor = 0;

	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		memcpy(&phrase_buffer[phrase_buffer_cursor], word_source->getWord(random_indices[i]), str_sizes[i]);

		phrase_buffer_cursor += str_sizes[i];
		phrase_buffer[phrase_buffer_cursor++] = ' ';
	}
	

	return phrase_buffer;
}

void User::createCryptoKey(const std::string& password)
{

	// TODO: put it in secure location
	static const unsigned char app_secret[] = { 0x21, 0xff, 0xbb, 0xc6, 0x16, 0xfe };

	sha_context context_sha512;
	//unsigned char* hash512 = (unsigned char*)malloc(SHA_512_SIZE);
	if (SHA_512_SIZE < crypto_pwhash_SALTBYTES) {
		addError(new Error(__FUNCTION__, "sha512 is to small for libsodium pwhash saltbytes"));
		return;
	}
	

	unsigned char hash512_salt[SHA_512_SIZE]; // need at least crypto_pwhash_SALTBYTES 16U
	sha512_init(&context_sha512);
	sha512_update(&context_sha512, (const unsigned char*)mEmail.data(), mEmail.size());
	sha512_update(&context_sha512, app_secret, 6);
	sha512_final(&context_sha512, hash512_salt);

	unsigned char* key = (unsigned char *)malloc(crypto_box_SEEDBYTES); // 32U

	if (crypto_pwhash(key, crypto_box_SEEDBYTES, password.data(), password.size(), hash512_salt, 10U, 33554432, 2) != 0) {
		addError(new ParamError(__FUNCTION__, " error creating pwd hash, maybe to much memory requestet? error:", strerror(errno)));
		//printf("[User::%s] error creating pwd hash, maybe to much memory requestet? error: %s\n", __FUNCTION__, strerror(errno));
		//printf("pwd: %s\n", pwd);
		return ;
	}
	crypto_shorthash(mPasswordHashed, key, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	lock();
	mCryptoKey = new ObfusArray(crypto_box_SEEDBYTES, key);
	unlock();
	free(key);

	// mCryptoKey

}