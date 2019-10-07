#include "User.h"
#include "Profiler.h"
#include "Session.h"
#include <sodium.h>
#include "ed25519/ed25519.h"
#include "Poco/Util/Application.h"
#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"

#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;



// -------------------------------------------------------------------------------------------------

int UserCreateCryptoKey::run() 
{
	auto cryptoKey = mUser->createCryptoKey(mPassword);
	mUser->setCryptoKey(cryptoKey);

	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		printf("[UserCreateCryptoKey] crypto_shorthash_BYTES != sizeof(mPasswordHashed)\n");
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(mPasswordHashed)");
	}
	User::passwordHashed pwdHashed;
	
	crypto_shorthash((unsigned char*)&pwdHashed, *cryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	mUser->setPwdHashed(pwdHashed);

	printf("crypto key created\n");
	return 0;
}

// -------------------------------------------------------------------------------------------------------------

int UserGenerateKeys::run() 
{
	Profiler timeUsed;
	// always return true, cannot fail (only if low on memory)
	mKeys.generateFromPassphrase(mPassphrase.data(), &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);

	mUser->setPublicKeyHex(mKeys.getPubkeyHex());

	printf("[UserGenerateKeys::run] time: %s\n", timeUsed.string().data());

	return 0;
}

// -----------------------------------------------------------------------------------------------------

int UserWriteIntoDB::run()
{
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement insert = mUser->insertIntoDB(session);
	try {
		if (1 != insert.execute()) {
			mUser->addError(new Error("User::insertIntoDB", "error by inserting data tuple to db"));
			return -1;
		}
	} catch (Poco::Exception& ex) {
		em->addError(new ParamError("[UserWriteIntoDB]", "error writing into db", ex.displayText().data()));
		em->sendErrorsAsEmail();
		return -3;
	}
	if (!mUser->loadEntryDBId(session)) {
		return -2;
	}
	return 0;
}

// --------------------------------------------------------------------------------------------------------

UserWriteKeysIntoDB::UserWriteKeysIntoDB(UniLib::controller::TaskPtr parent, User* user, bool savePrivKey)
	: UniLib::controller::CPUTask(1), mUser(user), mSavePrivKey(savePrivKey)
{
	if (strcmp(parent->getResourceType(), "UserGenerateKeys") != 0) {
		throw Poco::Exception("given TaskPtr isn't UserGenerateKeys");
	}
	setParentTaskPtrInArray(parent, 0);
}

int UserWriteKeysIntoDB::run()
{
	Profiler timeUsed;
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);	
	auto keyPairs = getParent(0).cast<UserGenerateKeys>()->getKeyPairs();
	auto pubKey = keyPairs->getPublicKey();
	
	printf("[UserWriteKeysIntoDB] after init\n");
	
	Poco::Data::BLOB pubkey_blob(pubKey, crypto_sign_PUBLICKEYBYTES);
	Poco::Data::Statement update(session);
	Poco::Data::BLOB* pprivkey_blob = nullptr;
	if (mSavePrivKey) {
		printf("[UserWriteKeysIntoDB] save privkey\n");
		// TODO: encrypt privkey
		auto privKey = keyPairs->getPrivateKey();
		printf("[UserWriteKeysIntoDB] privKey hex: %s\n", KeyPair::getHex(*privKey, privKey->size()).data());
		pprivkey_blob = mUser->encrypt(privKey);
		printf("[UserWriteKeysIntoDB] privkey encrypted\n");
		//Poco::Data::BLOB privkey_blob(*privKey, privKey->size());

		update << "UPDATE users SET pubkey=?, privkey=? where id=?",
			use(pubkey_blob), use(*pprivkey_blob), bind(mUser->getDBId());
	}
	else {
		update << "UPDATE users SET pubkey=? where id=?",
			use(pubkey_blob), bind(mUser->getDBId());
	}

	try {
		if (update.execute() != 1) {
			em->addError(new ParamError("UserWritePrivKeyIntoDB::run", "error writing keys into db for user", std::to_string(mUser->getDBId())));
			em->sendErrorsAsEmail();
			if (pprivkey_blob) {
				delete pprivkey_blob;
			}
			return -1;
		}
	}
	catch (Poco::Exception& ex) {
		em->addError(new ParamError("UserWritePrivKeyIntoDB::run", "mysql error updating", ex.displayText().data()));
		em->sendErrorsAsEmail();
		if (pprivkey_blob) {
			delete pprivkey_blob;
		}
		return -1;
	}
	printf("[UserWriteKeysIntoDB] after saving into db\n");
	if (pprivkey_blob) {
		delete pprivkey_blob;
	}
	printf("UserWritePrivKeyIntoDB time: %s\n", timeUsed.string().data());
	return 0;
}

// *******************************************************************************
// new user
User::User(const char* email, const char* name)
	: mDBId(0), mEmail(email), mFirstName(name), mPasswordHashed(0), mEmailChecked(false), mCryptoKey(nullptr)
{

}
// load from db
User::User(const char* email)
	: mDBId(0), mEmail(email), mPasswordHashed(0), mEmailChecked(false), mCryptoKey(nullptr)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	//memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	Poco::Nullable<Poco::Data::BLOB> pubkey;

	Poco::Data::Statement select(session);
	int email_checked = 0;
	select << "SELECT id, name, password, pubkey, email_checked from users where email = ?",
		into(mDBId), into(mFirstName), into(mPasswordHashed), into(pubkey), into(email_checked), use(mEmail);
	try {
		auto result = select.execute();
		int zahl = 1;
		if (result == 1) {
			if (!pubkey.isNull()) {
				auto pubkey_value = pubkey.value();
				size_t hexSize = pubkey_value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
				mPublicHex = hexString;
				free(hexString);
			}
			if (email_checked != 0) mEmailChecked = true;
		}
	} catch(Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}



User::~User()
{
	if (mCryptoKey) {
		delete mCryptoKey;
	}
}


std::string User::generateNewPassphrase(Mnemonic* word_source)
{
	auto em = ErrorManager::getInstance();
	unsigned int random_indices[PHRASE_WORD_COUNT];
	unsigned int str_sizes[PHRASE_WORD_COUNT];
	unsigned int phrase_buffer_size = 0;

	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		random_indices[i] = randombytes_random() % 2048;
		auto word = word_source->getWord(random_indices[i]);
		if (!word) {
			em->addError(new ParamError("User::generateNewPassphrase", "empty word get for index", random_indices[i]));
			em->sendErrorsAsEmail();

			random_indices[i] = randombytes_random() % 2048;
			word = word_source->getWord(random_indices[i]);
			if (!word) return "Ein Fehler, bitte wende dich an den Server-Admin.";
		}
		str_sizes[i] = strlen(word);
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
	// TODO: put it in secure location, or use value from server config
	static const unsigned char app_secret[] = { 0x21, 0xff, 0xbb, 0xc6, 0x16, 0xfe };

	sha_context context_sha512;
	//unsigned char* hash512 = (unsigned char*)malloc(SHA_512_SIZE);
	if (SHA_512_SIZE < crypto_pwhash_SALTBYTES) {
		addError(new Error(__FUNCTION__, "sha512 is to small for libsodium pwhash saltbytes"));
		return nullptr;
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
		return nullptr;
	}
	
	lock();
	auto cryptoKey = new ObfusArray(crypto_box_SEEDBYTES, key);
	unlock();
	free(key);

	// mCryptoKey
	printf("[User::createCryptoKey] time used: %s\n", timeUsed.string().data());
	return cryptoKey;
}

bool User::generateKeys(bool savePrivkey, const std::string& passphrase, Session* session)
{
	Profiler timeUsed;
	
	UniLib::controller::TaskPtr generateKeysTask(new UserGenerateKeys(this, passphrase));
	//generateKeysTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_KEY_PAIR_GENERATED, session));
	//generateKeysTask->scheduleTask(generateKeysTask);
	// run directly because we like to show pubkey on interface, shouldn't last to long
	generateKeysTask->run();
	session->updateState(SESSION_STATE_KEY_PAIR_GENERATED);

	if (mDBId == 0) {
		//printf("[User::generateKeys] dbid is zero, load from db\n");
		loadEntryDBId(ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));
		if (mDBId == 0) {
			auto em = ErrorManager::getInstance();
			em->addError(new ParamError("User::generateKeys", "user not found in db with email", mEmail.data()));
			em->sendErrorsAsEmail();
		}
		return false;
	}

	UniLib::controller::TaskPtr saveKeysTask(new UserWriteKeysIntoDB(generateKeysTask, this, savePrivkey));
	saveKeysTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_KEY_PAIR_WRITTEN, session));
	saveKeysTask->scheduleTask(saveKeysTask);


	printf("[User::generateKeys] call two tasks, time used: %s\n", timeUsed.string().data());
	return true;

}

Poco::Data::BLOB* User::encrypt(const ObfusArray* data)
{
	if (!hasCryptoKey()) {
		addError(new Error("User::encrypt", "hasn't crypto key"));
		return nullptr;
	}
	size_t message_len = data->size();
	size_t ciphertext_len = crypto_secretbox_MACBYTES + message_len;

	unsigned char nonce[crypto_secretbox_NONCEBYTES];
	// we use a hardcoded value for nonce
	memset(nonce, 31, crypto_secretbox_NONCEBYTES);

	unsigned char* ciphertext = (unsigned char*)malloc(ciphertext_len);
	memset(ciphertext, 0, ciphertext_len);

	if (0 != crypto_secretbox_easy(ciphertext, *data, message_len, nonce, *mCryptoKey)) {
		//printf("[%s] error encrypting message \n", __FUNCTION__);
		addError(new Error("User::encrypt", "encrypting message failed"));
		free(ciphertext);
		return nullptr;
	}

	printf("[User::encrypt] encrypted: %s\n", KeyPair::getHex(ciphertext, ciphertext_len).data());
	auto result_blob = new Poco::Data::BLOB(ciphertext, ciphertext_len);
	free(ciphertext);
	
	return result_blob;
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
	auto em = ErrorManager::getInstance();
	Poco::Data::Statement select(session);
	 
	select << "SELECT id from users where email = ?;", 
		into(mDBId), use(mEmail);
	try {
		if (select.execute() != 1) {
			addError(new Error("User::loadEntryDBId", "didn't get expectet row count (1)"));
			return false;
		}
	} catch(Poco::Exception& ex) {
		em->addError(new ParamError("[User::loadEntryDBId]", "error selecting from db", ex.displayText().data()));
		em->sendErrorsAsEmail();
	}

	return true;
}