#include "User.h"
#include "Profiler.h"
#include "Session.h"
#include <sodium.h>
#include "ed25519/ed25519.h"
#include "Poco/Util/Application.h"
#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SessionManager.h"

#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;

//#define DEBUG_USER_DELETE_ENV


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
	setTaskFinished();
	// must poke cpu scheduler manually because another task is waiting for this task, but in the other scheduler
	ServerConfig::g_CPUScheduler->checkPendingTasks();
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

UserWriteKeysIntoDB::UserWriteKeysIntoDB(UniLib::controller::TaskPtr parent, Poco::AutoPtr<User> user, bool savePrivKey)
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
	
	//printf("[UserWriteKeysIntoDB] after init\n");
	
	Poco::Data::BLOB pubkey_blob(pubKey, crypto_sign_PUBLICKEYBYTES);
	Poco::Data::Statement update(session);
	Poco::Data::BLOB* pprivkey_blob = nullptr;
	if (mSavePrivKey) {
		//printf("[UserWriteKeysIntoDB] save privkey\n");
		// TODO: encrypt privkey
		auto privKey = keyPairs->getPrivateKey();
		//printf("[UserWriteKeysIntoDB] privKey hex: %s\n", KeyPair::getHex(*privKey, privKey->size()).data());
		pprivkey_blob = mUser->encrypt(privKey);
		//printf("[UserWriteKeysIntoDB] privkey encrypted\n");
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
	//printf("[UserWriteKeysIntoDB] after saving into db\n");
	if (pprivkey_blob) {
		delete pprivkey_blob;
	}
	//printf("UserWritePrivKeyIntoDB time: %s\n", timeUsed.string().data());
	return 0;
}

// --------------------------------------------------------------------------------------------------------

UserWriteCryptoKeyHashIntoDB::UserWriteCryptoKeyHashIntoDB(Poco::AutoPtr<User> user, int dependencieCount/* = 0*/)
	: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler, dependencieCount), mUser(user)
{

}

int UserWriteCryptoKeyHashIntoDB::run()
{
	mUser->updateIntoDB(USER_FIELDS_PASSWORD);
	return 0;
}

// *******************************************************************************
// new user
User::User(const char* email, const char* first_name, const char* last_name)
	: mState(USER_EMPTY), mDBId(0), mEmail(email), mFirstName(first_name), mLastName(last_name), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), mCryptoKey(nullptr),
	 mReferenceCount(1)
{

}
// load from db
User::User(const char* email)
	: mState(USER_EMPTY), mDBId(0), mEmail(email), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), mCryptoKey(nullptr), mReferenceCount(1)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	//memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	Poco::Nullable<Poco::Data::BLOB> pubkey; 
	Poco::Nullable<Poco::Data::BLOB> privkey;

	Poco::Data::Statement select(session);
	int email_checked = 0;
	select << "SELECT id, first_name, last_name, password, pubkey, privkey, email_checked from users where email = ?",
		into(mDBId), into(mFirstName), into(mLastName), into(mPasswordHashed), into(pubkey), into(privkey), into(email_checked), use(mEmail);
	try {
		auto result = select.execute();
		if (result == 1) {
			mState = USER_LOADED_FROM_DB;
			if (email_checked == 0) {    mState = USER_EMAIL_NOT_ACTIVATED;}
			else if (pubkey.isNull()) {  mState = USER_NO_KEYS;}
			else if (privkey.isNull()) { mState = USER_NO_PRIVATE_KEY; }
			else {						 mState = USER_COMPLETE;}

			mEmailChecked = email_checked == 1;

			if (!pubkey.isNull()) {
				auto pubkey_value = pubkey.value();
				size_t hexSize = pubkey_value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
				mPublicHex = hexString;
				free(hexString);
			}
			if (!privkey.isNull()) {
				auto privkey_value = privkey.value();
				mPrivateKey = new ObfusArray(privkey_value.size(), privkey_value.content().data());
			}
			

		}
	} catch(Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}

User::User(int user_id)
: mState(USER_EMPTY), mDBId(user_id), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), mCryptoKey(nullptr), mReferenceCount(1)
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	Poco::Nullable<Poco::Data::BLOB> pubkey;
	Poco::Nullable<Poco::Data::BLOB> privkey;

	Poco::Data::Statement select(session);
	int email_checked = 0;
	select << "SELECT email, first_name, last_name, password, pubkey, privkey, email_checked from users where id = ?",
		into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(pubkey), into(privkey), into(email_checked), use(user_id);
	try {
		auto result = select.execute();
		if (result == 1) {
			mState = USER_LOADED_FROM_DB;
			if (email_checked == 0) { mState = USER_EMAIL_NOT_ACTIVATED; }
			else if (pubkey.isNull()) { mState = USER_NO_KEYS; }
			else if (privkey.isNull()) { mState = USER_NO_PRIVATE_KEY; }
			else { mState = USER_COMPLETE; }

			mEmailChecked = email_checked == 1;

			if (!pubkey.isNull()) {
				auto pubkey_value = pubkey.value();
				size_t hexSize = pubkey_value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
				mPublicHex = hexString;
				free(hexString);
			}
			if (!privkey.isNull()) {
				auto privkey_value = privkey.value();
				mPrivateKey = new ObfusArray(privkey_value.size(), privkey_value.content().data());
			}
		}
	}
	catch (Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}



User::~User()
{
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::~User]\n");
#endif
	if (mCryptoKey) {
		delete mCryptoKey;
		mCryptoKey = nullptr;
	}
	if (mPrivateKey) {
		delete mPrivateKey;
		mPrivateKey = nullptr;
	}
}


std::string User::generateNewPassphrase(Mnemonic* word_source)
{
	auto em = ErrorManager::getInstance();
	unsigned int random_indices[PHRASE_WORD_COUNT];
	unsigned int str_sizes[PHRASE_WORD_COUNT];
	unsigned int phrase_buffer_size = 0;

	// TODO: make sure words didn't double
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

bool User::isEmptyPassword()
{
	bool bRet = false;
	lock();
	printf("[User::isEmptyPassword] pwd hashed: %d, running: %d, this: %d\n",
		mPasswordHashed, !mCreateCryptoKeyTask.isNull(), this);
	bRet = mPasswordHashed == 0 && (mCreateCryptoKeyTask.isNull() || mCreateCryptoKeyTask->isTaskFinished());
	unlock();
	return bRet;
}

UserStates User::getUserState()
{
	UserStates state;
	lock();
	state = mState;
	unlock();
	return state;
}

// TODO: if a password and privkey already exist, load current private key and re encrypt with new crypto key
bool User::setNewPassword(const std::string& newPassword)
{
	Profiler timeUsed;
	if (newPassword == "") {
		lock();
		addError(new Error("Passwort", "Ist leer."));
		unlock();
		return false;
	}
	if (!mCreateCryptoKeyTask.isNull() && !mCreateCryptoKeyTask->isTaskFinished()) {
		lock();
		addError(new Error("Passwort", "Wird bereits erstellt, bitte in ca. 1 sekunde neuladen."));
		unlock();
		return false;
	}
	duplicate();
	lock();
	printf("[User::setNewPassword] start create crypto key task with this: %d\n", this);
	mCreateCryptoKeyTask = new UserCreateCryptoKey(this, newPassword, ServerConfig::g_CPUScheduler);
	mCreateCryptoKeyTask->scheduleTask(mCreateCryptoKeyTask);
	unlock();

	duplicate();
	
	UniLib::controller::TaskPtr savePassword(new UserWriteCryptoKeyHashIntoDB(this, 1));
	savePassword->setParentTaskPtrInArray(mCreateCryptoKeyTask, 0);
	savePassword->scheduleTask(savePassword);


	printf("[User::setNewPassword] timeUsed: %s\n", timeUsed.string().data());
	return true;
}

void User::setEmailChecked()
{
	lock();
	mEmailChecked = true;
	if (mState <= USER_EMAIL_NOT_ACTIVATED) {
		if (mPublicHex == "") {
			mState = USER_NO_KEYS;
		}
		else if (!mPrivateKey) {
			mState = USER_NO_PRIVATE_KEY;
		}
		else {
			mState = USER_COMPLETE;
		}
	}
	unlock();
}

bool User::validatePwd(const std::string& pwd, ErrorList* validationErrorsToPrint)
{
	
	auto cmpCryptoKey = createCryptoKey(pwd);
	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(User::passwordHashed)");
	}
	User::passwordHashed pwdHashed;
	crypto_shorthash((unsigned char*)&pwdHashed, *cmpCryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	lock();
	if (pwdHashed == mPasswordHashed) {
		if (!mCryptoKey) {
			mCryptoKey = cmpCryptoKey;
		}
		else {
			delete cmpCryptoKey;
		}
		unlock();
		return true;
	}
	delete cmpCryptoKey;
	
	unlock();
	return false;
}

bool User::deleteFromDB()
{
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	
	Poco::Data::Statement deleteFromDB(session);
	//DELETE FROM `table_name` [WHERE condition];
	
	std::string tables[] = { "users", "email_opt_in", "user_backups" };

	/*deleteFromDB 
		<< "DELETE from users where id = ?;"
		 "DELETE from email_opt_in where user_id = ?;"
		 "DELETE from user_backups where user_id = ?",
		 use(mDBId), use(mDBId), use(mDBId);
		 */
	for (int i = 0; i < 3; i++) {
		if (i > 0) {
			deleteFromDB.reset(session);
			deleteFromDB << "DELETE from " << tables[i] << " where user_id = ?", use(mDBId);
		}
		else {
			deleteFromDB << "DELETE from " << tables[i] << " where id = ?", use(mDBId);
		}

		try {
			lock();
			auto result = deleteFromDB.execute();
			unlock();
			//printf("[User::deleteFromDB] %s deleted: %d\n", tables[i].data(), result);
		}
		catch (Poco::Exception& ex) {
			unlock();
			em->addError(new ParamError("[User::deleteFromDB]", "error deleting user tables", ex.displayText().data()));
			em->sendErrorsAsEmail();
			//return false;
		}
	}
	
	
	return true;
}

void User::duplicate()
{
	mWorkingMutex.lock();
	mReferenceCount++;
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::duplicate] new value: %d\n", mReferenceCount);
#endif
	mWorkingMutex.unlock();
}

void User::release()
{
	if (!mCreateCryptoKeyTask.isNull() && mCreateCryptoKeyTask->isTaskFinished()) {
		mCreateCryptoKeyTask = nullptr;
	}
	mWorkingMutex.lock();
	mReferenceCount--;
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::release] new value: %d, this: %d\n", mReferenceCount, this);
#endif
	if (0 == mReferenceCount) {
		mWorkingMutex.unlock();
		delete this;
		return;
	}
	mWorkingMutex.unlock();

}

ObfusArray* User::createCryptoKey(const std::string& password)
{

	Profiler timeUsed;
	// TODO: put it in secure location, or use value from server config
	static const unsigned char app_secret[] = { 0x21, 0xff, 0xbb, 0xc6, 0x16, 0xfe };

	sha_context context_sha512;
	//unsigned char* hash512 = (unsigned char*)malloc(SHA_512_SIZE);
	if (SHA_512_SIZE < crypto_pwhash_SALTBYTES) {
		lock();
		addError(new Error(__FUNCTION__, "sha512 is to small for libsodium pwhash saltbytes"));
		unlock();
		return nullptr;
	}
	

	unsigned char hash512_salt[SHA_512_SIZE]; // need at least crypto_pwhash_SALTBYTES 16U
	sha512_init(&context_sha512);
	sha512_update(&context_sha512, (const unsigned char*)mEmail.data(), mEmail.size());
	sha512_update(&context_sha512, app_secret, 6);
	sha512_final(&context_sha512, hash512_salt);

	unsigned char* key = (unsigned char *)malloc(crypto_box_SEEDBYTES); // 32U

	if (crypto_pwhash(key, crypto_box_SEEDBYTES, password.data(), password.size(), hash512_salt, 10U, 33554432, 2) != 0) {
		lock();
		addError(new ParamError(__FUNCTION__, " error creating pwd hash, maybe to much memory requestet? error:", strerror(errno)));
		unlock();
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
	
	duplicate();
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

	duplicate();
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
	if (mPasswordHashed) {
		insert << "INSERT INTO users (email, first_name, last_name, password) VALUES(?, ?, ?, ?);",
			use(mEmail), use(mFirstName), use(mLastName), bind(mPasswordHashed);
	}
	else {
		insert << "INSERT INTO users (email, first_name, last_name) VALUES(?, ?, ?);",
			use(mEmail), use(mFirstName), use(mLastName);
	}


	return insert;
}

bool User::updateIntoDB(UserFields fieldType)
{
	
	if (mDBId == 0) {
		addError(new Error("User::updateIntoDB", "user id is zero"));
		return false; 
	}
	if (USER_FIELDS_PASSWORD == fieldType || USER_FIELDS_EMAIL_CHECKED == fieldType) {
		auto session = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement update(session);
		if (USER_FIELDS_PASSWORD == fieldType) {
			update << "UPDATE users SET password = ? where id = ?",
				use(mPasswordHashed), use(mDBId);
		}
		else if (USER_FIELDS_EMAIL_CHECKED == fieldType) {
			update << "UPDATE users SET email_checked = ? where id = ?",
				use(mEmailChecked), use(mDBId);
		}
		try {
			if (update.execute() == 1) return true;
			addError(new ParamError("User::updateIntoDB", "update not affected 1 rows", fieldType));
		}
		catch (Poco::Exception& ex) {
			auto em = ErrorManager::getInstance();
			em->addError(new ParamError("User::updateIntoDB", "mysql error", ex.displayText().data()));
			em->sendErrorsAsEmail();
		}
	}

	return false;

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