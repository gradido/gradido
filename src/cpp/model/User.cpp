#include "User.h"
#include "Profiler.h"
#include <sodium.h>
#include "ed25519/ed25519.h"
#include "Poco/Util/Application.h"
#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"

#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;

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
	auto cryptoKey = mUser->createCryptoKey(mPassword);
	mUser->setCryptoKey(cryptoKey);

	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(mPasswordHashed)");
	}
	User::passwordHashed pwdHashed;
	crypto_shorthash((unsigned char*)&pwdHashed, *cryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);

	mUser->setPwdHashed(pwdHashed);

	printf("crypto key created\n");
	return 0;
}

// -----------------------------------------------------------------------------------------------------

int UserWriteIntoDB::run()
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement insert = mUser->insertIntoDB(session);
	if (1 != insert.execute()) {
		mUser->addError(new Error("User::insertIntoDB", "error by inserting data tuple to db"));
		return -1;
	}
	if (!mUser->loadEntryDBId(session)) {
		return -2;
	}
	return 0;
}

// *******************************************************************************


User::User(const char* email, const char* name)
	: mDBId(0), mEmail(email), mFirstName(name), mPasswordHashed(0), mEmailChecked(false), mCryptoKey(nullptr)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	//memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	Poco::Nullable<Poco::Data::BLOB> pubkey;

	Poco::Data::Statement select(session);
	select << "SELECT id, password, pubkey, email_checked from users where email = ?",
		into(mDBId), into(mPasswordHashed), into(pubkey), into(mEmailChecked), use(mEmail);
	try {
		if (select.execute() == 1) {
			if (!pubkey.isNull()) {
				size_t hexSize = pubkey.value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey.value.content().data(), pubkey.value.size());
				mPublicHex = hexString;
				free(hexString);
			}
		}
	} catch(...) {}
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

bool User::validatePassphrase(const std::string& passphrase)
{
	std::istringstream iss(passphrase);
	std::vector<std::string> results(std::istream_iterator<std::string>{iss},
								     std::istream_iterator<std::string>());
	for (int i = 0; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) {
		auto m = ServerConfig::g_Mnemonic_WordLists[i];
		bool existAll = true;
		for (auto it = results.begin(); it != results.end(); it++) {
			if (!m.isWordExist(*it)) {
				existAll = false;
				continue;
			}
		}
		if (existAll) return true;
	}
	return false;
}

bool User::validatePwd(const std::string& pwd)
{
	auto cmpCryptoKey = createCryptoKey(pwd);
	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(User::passwordHashed)");
	}
	User::passwordHashed pwdHashed;
	crypto_shorthash((unsigned char*)&pwdHashed, *cmpCryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	if (pwdHashed == mPasswordHashed) {
		if (!mCryptoKey) {
			mCryptoKey = cmpCryptoKey;
		}
		else {
			delete cmpCryptoKey;
		}
		return true;
	}
	delete cmpCryptoKey;
	return false;
}

ObfusArray* User::createCryptoKey(const std::string& password)
{

	Profiler timeUsed;
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
	
	lock();
	auto cryptoKey = new ObfusArray(crypto_box_SEEDBYTES, key);
	unlock();
	free(key);

	// mCryptoKey
	printf("[User::createCryptoKey] time used: %s\n", timeUsed.string().data());
	return cryptoKey;
}

bool User::generateKeys(bool savePrivkey, const std::string& passphrase)
{
	// TODO: call create key pair from passphrase from worker thread
	// TODO: evt. save privkey from worker thread
}

Poco::Data::Statement User::insertIntoDB(Poco::Data::Session session)
{

	Poco::Data::Statement insert(session);

	//Poco::Data::BLOB pwd(&mPasswordHashed[0], crypto_shorthash_BYTES);

	//printf("[User::insertIntoDB] password hashed: %llu\n", mPasswordHashed);
	insert << "INSERT INTO users (email, name, password) VALUES(?, ?, ?);",
		use(mEmail), use(mFirstName), bind(mPasswordHashed);

	return insert;
}

bool User::loadEntryDBId(Poco::Data::Session session)
{
	Poco::Data::Statement select(session);
	 
	select << "SELECT id from users where email = ?;", 
		into(mDBId), use(mEmail);

	if (select.execute() != 1) {
		addError(new Error("User::loadEntryDBId", "didn't get expectet row count (1)"));
		return false;
	}

	return true;
}