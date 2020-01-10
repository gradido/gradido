#include "User.h"
#include "Session.h"
#include <sodium.h>
#include "ed25519/ed25519.h"
#include "Poco/Util/Application.h"
#include "Poco/RegularExpression.h"
#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"


#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;

//#define DEBUG_USER_DELETE_ENV


// -------------------------------------------------------------------------------------------------

UserCreateCryptoKey::UserCreateCryptoKey(Poco::AutoPtr<User> user, const std::string& password, UniLib::controller::CPUSheduler* cpuScheduler)
	: UniLib::controller::CPUTask(cpuScheduler), mUser(user), mPassword(password) {
#ifdef _UNI_LIB_DEBUG
	setName(user->getEmail());
#endif
	
}

int UserCreateCryptoKey::run() 
{
	auto cryptoKey = mUser->createCryptoKey(mPassword);
	mUser->setCryptoKey(cryptoKey);

	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		printf("[UserCreateCryptoKey] crypto_shorthash_BYTES != sizeof(mPasswordHashed)\n");
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(mPasswordHashed)");
	}

	auto pwdHashed = mUser->createPasswordHashed(cryptoKey);
	mUser->setPwdHashed(pwdHashed);


	//printf("crypto key created\n");
	setTaskFinished();
	// must poke cpu scheduler manually because another task is waiting for this task, but in the other scheduler
	ServerConfig::g_CPUScheduler->checkPendingTasks();
	return 0;
}

// -------------------------------------------------------------------------------------------------------------

int UserGenerateKeys::run() 
{
	
	// always return true, cannot fail (only if low on memory)
	// !!! update: can no fail, if passphrase is invalid, for example if memory is corrupted
	if (!mKeys.generateFromPassphrase(mPassphrase.data(), &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER])) {
		mUser->addError(new Error(mUser->gettext("User generate Keys"), mUser->gettext("invalid passphrase, please notice the server admin coin@gradido.net")));
		return -1;
	}

	mUser->setPublicKeyHex(mKeys.getPubkeyHex());
	mUser->setPublicKey(mKeys.getPublicKey());
	if (mUser->hasCryptoKey()) {
		mUser->setPrivKey(mKeys.getPrivateKey());
	}

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

UserWriteKeysIntoDB::UserWriteKeysIntoDB(std::vector<UniLib::controller::TaskPtr> parents, Poco::AutoPtr<User> user, bool savePrivKey)
	: UniLib::controller::CPUTask(parents.size()), mUser(user), mSavePrivKey(savePrivKey)
{
#ifdef _UNI_LIB_DEBUG
	setName(user->getEmail());
#endif
	if (parents.size() < 1 || strcmp(parents[0]->getResourceType(), "UserGenerateKeys") != 0) {
		throw Poco::Exception("given TaskPtr isn't UserGenerateKeys");
	}
	for (int i = 0; i < parents.size(); i++) {
		setParentTaskPtrInArray(parents[i], i);
	}
	//setParentTaskPtrInArray(parents[0], 0);
	
}

int UserWriteKeysIntoDB::run()
{
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);	
	auto keyPairs = getParent(0).cast<UserGenerateKeys>()->getKeyPairs();
	auto pubKey = keyPairs->getPublicKey();
	static const char* functionName = "UserWritePrivKeyIntoDB::run";
	
	//printf("[UserWriteKeysIntoDB] after init\n");
	
	Poco::Data::BLOB pubkey_blob(pubKey, crypto_sign_PUBLICKEYBYTES);
	Poco::Data::Statement update(session);
	Poco::Data::BLOB* pprivkey_blob = nullptr;
	if (mSavePrivKey) {
		//printf("[UserWriteKeysIntoDB] save privkey\n");
		// TODO: encrypt privkey
		auto privKey = keyPairs->getPrivateKey();
		//printf("[UserWriteKeysIntoDB] privKey hex: %s\n", KeyPair::getHex(*privKey, privKey->size()).data());
		auto encryptedPrivKey = mUser->encrypt(privKey);
		//pprivkey_blob = mUser->encrypt(privKey);
		if (!encryptedPrivKey) {
			em->addError(new Error(functionName, "no privkey found"));
			em->sendErrorsAsEmail();
			return -1;
		}
		pprivkey_blob = new Poco::Data::BLOB(*encryptedPrivKey, encryptedPrivKey->size());
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
			em->addError(new ParamError(functionName, "error writing keys into db for user", std::to_string(mUser->getDBId())));
			em->sendErrorsAsEmail();
			if (pprivkey_blob) {
				delete pprivkey_blob;
			}
			return -1;
		}
	}
	catch (Poco::Exception& ex) {
		em->addError(new ParamError(functionName, "mysql error updating", ex.displayText().data()));
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
	
	return 0;
}

// --------------------------------------------------------------------------------------------------------

UserWriteCryptoKeyHashIntoDB::UserWriteCryptoKeyHashIntoDB(Poco::AutoPtr<User> user, int dependencieCount/* = 0*/)
	: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler, dependencieCount), mUser(user)
{
#ifdef _UNI_LIB_DEBUG
	setName(user->getEmail());
#endif
}

int UserWriteCryptoKeyHashIntoDB::run()
{
	mUser->updateIntoDB(USER_FIELDS_PASSWORD);
	return 0;
}

// *******************************************************************************
// new user
User::User(const char* email, const char* first_name, const char* last_name)
	: mState(USER_EMPTY), mDBId(0), mEmail(email), mFirstName(first_name), mLastName(last_name), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false),
	mLanguage(LANG_DE), mGradidoCurrentBalance(0), mCryptoKey(nullptr), mReferenceCount(1)
{
	memset(mPublicKey, 0, crypto_sign_PUBLICKEYBYTES);
	mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(mLanguage);
}
// load from db
User::User(const char* email)
	: mState(USER_EMPTY), mDBId(0), mEmail(email), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), 
	mLanguage(LANG_DE), mGradidoCurrentBalance(0), mCryptoKey(nullptr), mReferenceCount(1)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	//memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	memset(mPublicKey, 0, crypto_sign_PUBLICKEYBYTES);

	Poco::Nullable<Poco::Data::BLOB> pubkey; 
	Poco::Nullable<Poco::Data::BLOB> privkey;

	Poco::Data::Statement select(session);
	int email_checked = 0;
	std::string language_key;
	select << "SELECT id, first_name, last_name, password, pubkey, privkey, email_checked, language from users where email = ?",
		into(mDBId), into(mFirstName), into(mLastName), into(mPasswordHashed), into(pubkey), into(privkey), into(email_checked), into(language_key),
		use(mEmail);
	try {
		auto result = select.execute();
		if (result == 1) {
			mState = USER_LOADED_FROM_DB;
			mLanguage = LanguageManager::languageFromString(language_key);
			mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(mLanguage);

			if (email_checked == 0) {    mState = USER_EMAIL_NOT_ACTIVATED;}
			else if (pubkey.isNull()) {  mState = USER_NO_KEYS;}
			else if (privkey.isNull()) { mState = USER_NO_PRIVATE_KEY; }
			else {						 mState = USER_COMPLETE;}

			mEmailChecked = email_checked == 1;

			if (!pubkey.isNull()) {
				auto pubkey_value = pubkey.value();
				if (pubkey_value.size() == crypto_sign_PUBLICKEYBYTES) {
					memcpy(mPublicKey, pubkey_value.content().data(), crypto_sign_PUBLICKEYBYTES);
				}
				else {
					addError(new Error("User", "pubkey from db has other size as expected"));
				}
				size_t hexSize = pubkey_value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
				mPublicHex = hexString;
				free(hexString);
			}
			if (!privkey.isNull()) {
				auto privkey_value = privkey.value();
				auto privkey_size = privkey_value.size();
				//mPrivateKey = new ObfusArray(privkey_value.size(), privkey_value.content().data());
				mPrivateKey = MemoryManager::getInstance()->getFreeMemory(privkey_size);
				memcpy(*mPrivateKey, privkey_value.content().data(), privkey_size);
			}
			
		}
	} catch(Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}

User::User(int user_id)
	: mState(USER_EMPTY), mDBId(user_id), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), 
    mLanguage(LANG_DE), mGradidoCurrentBalance(0), mCryptoKey(nullptr), mReferenceCount(1)
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	memset(mPublicKey, 0, crypto_sign_PUBLICKEYBYTES);

	Poco::Nullable<Poco::Data::BLOB> pubkey;
	Poco::Nullable<Poco::Data::BLOB> privkey;

	Poco::Data::Statement select(session);
	int email_checked = 0;
	std::string language_key;
	select << "SELECT email, first_name, last_name, password, pubkey, privkey, email_checked, language from users where id = ?",
		into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(pubkey), into(privkey), into(email_checked), into(language_key),
		use(user_id);
	try {
		auto result = select.execute();
		if (result == 1) {
			mState = USER_LOADED_FROM_DB;
			mLanguage = LanguageManager::languageFromString(language_key);
			mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(mLanguage);

			if (email_checked == 0) { mState = USER_EMAIL_NOT_ACTIVATED; }
			else if (pubkey.isNull()) { mState = USER_NO_KEYS; }
			else if (privkey.isNull()) { mState = USER_NO_PRIVATE_KEY; }
			else { mState = USER_COMPLETE; }

			mEmailChecked = email_checked == 1;

			if (!pubkey.isNull()) {
				auto pubkey_value = pubkey.value();
				if (pubkey_value.size() == crypto_sign_PUBLICKEYBYTES) {
					memcpy(mPublicKey, pubkey_value.content().data(), crypto_sign_PUBLICKEYBYTES);
				}
				else {
					addError(new Error("User", "pubkey from db has other size as expected"));
				}
				size_t hexSize = pubkey_value.size() * 2 + 1;
				char* hexString = (char*)malloc(hexSize);
				memset(hexString, 0, hexSize);
				sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
				mPublicHex = hexString;
				free(hexString);
			}
			if (!privkey.isNull()) {
				auto privkey_value = privkey.value();
				auto privkey_size = privkey_value.size();
				//mPrivateKey = new ObfusArray(privkey_value.size(), privkey_value.content().data());
				mPrivateKey = MemoryManager::getInstance()->getFreeMemory(privkey_size);
				memcpy(*mPrivateKey, privkey_value.content().data(), privkey_size);
			}
		}
	}
	catch (Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}

User::User(const unsigned char* pubkey_array)
	: mState(USER_EMPTY), mDBId(0), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false), 
	mLanguage(LANG_DE), mGradidoCurrentBalance(0), mCryptoKey(nullptr), mReferenceCount(1)
{
	//crypto_shorthash(mPasswordHashed, (const unsigned char*)password, strlen(password), *ServerConfig::g_ServerCryptoKey);
	//memset(mPasswordHashed, 0, crypto_shorthash_BYTES);
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

	memcpy(mPublicKey, pubkey_array, crypto_sign_PUBLICKEYBYTES);

	Poco::Data::BLOB pubkey(pubkey_array, 32);
	Poco::Nullable<Poco::Data::BLOB> privkey;

	Poco::Data::Statement select(session);
	int email_checked = 0; 
	std::string language_key;
	select << "SELECT id, email, first_name, last_name, password, privkey, email_checked, language from users where pubkey = ?",
		into(mDBId), into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(privkey), into(email_checked), into(language_key),
		use(pubkey);
	try {
		auto result = select.execute();
		if (result == 1) {
			mState = USER_LOADED_FROM_DB;
			mLanguage = LanguageManager::languageFromString(language_key);
			mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(mLanguage);

			if (email_checked == 0) { mState = USER_EMAIL_NOT_ACTIVATED; }
			else if (privkey.isNull()) { mState = USER_NO_PRIVATE_KEY; }
			else { mState = USER_COMPLETE; }

			mEmailChecked = email_checked == 1;

			size_t hexSize = pubkey.size() * 2 + 1;
			char* hexString = (char*)malloc(hexSize);
			memset(hexString, 0, hexSize);
			sodium_bin2hex(hexString, hexSize, pubkey.content().data(), pubkey.size());
			mPublicHex = hexString;
			free(hexString);
			
			if (!privkey.isNull()) {
				auto privkey_value = privkey.value();
				auto privkey_size = privkey_value.size();
				//mPrivateKey = new ObfusArray(privkey_value.size(), privkey_value.content().data());
				mPrivateKey = MemoryManager::getInstance()->getFreeMemory(privkey_size);
				memcpy(*mPrivateKey, privkey_value.content().data(), privkey_size);
			}

		}

	}
	catch (Poco::Exception& ex) {
		addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
	}
}

User::User(Poco::AutoPtr<controller::User> ctrl_user)
	: mUserCtrl(ctrl_user), mState(USER_EMPTY), mDBId(0), mPasswordHashed(0), mPrivateKey(nullptr), mEmailChecked(false),
	mLanguage(LANG_DE), mGradidoCurrentBalance(0), mCryptoKey(nullptr), mReferenceCount(1)
{
	assert(!ctrl_user.isNull());
	auto model = ctrl_user->getModel();
	assert(model);

	auto mm = MemoryManager::getInstance();
	mDBId = model->getID();
	mEmail = model->getEmail();
	mFirstName = model->getFirstName();
	mLastName = model->getLastName();
	mPasswordHashed = model->getPasswordHashed();
	auto pubkey = model->getPublicKey();
	if (pubkey) {
		memcpy(mPublicKey, pubkey, crypto_sign_PUBLICKEYBYTES);

		size_t hexSize = crypto_sign_PUBLICKEYBYTES * 2 + 1;
		auto hexStringTemp = mm->getFreeMemory(hexSize);
		//char* hexString = (char*)malloc(hexSize);
		memset(*hexStringTemp, 0, hexSize);
		sodium_bin2hex((char*)(*hexStringTemp), hexSize, pubkey, crypto_sign_PUBLICKEYBYTES);
		mPublicHex = *hexStringTemp;
		mm->releaseMemory(hexStringTemp);
	}
	if (model->existPrivateKeyCrypted()) {
		auto privKeyVetor = model->getPrivateKeyCrypted();
		mPrivateKey = mm->getFreeMemory(privKeyVetor.size());
		memcpy(*mPrivateKey, privKeyVetor.data(), privKeyVetor.size());
	}
	mEmailChecked = model->isEmailChecked();
	mLanguage = LanguageManager::languageFromString(model->getLanguageKey());
	mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(mLanguage);
}


User::~User()
{
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::~User]\n");
#endif
	auto mm = MemoryManager::getInstance();
	if (mCryptoKey) {
		//delete mCryptoKey;
		mm->releaseMemory(mCryptoKey);
		mCryptoKey = nullptr;
	}
	if (mPrivateKey) {
		//delete mPrivateKey;
		mm->releaseMemory(mPrivateKey);
		mPrivateKey = nullptr;
	}
}

void User::setLanguage(Languages lang)
{ 
	lock("User::setLanguage"); 
	if (mLanguage != lang) {
		mLanguageCatalog = LanguageManager::getInstance()->getFreeCatalog(lang);
	}
	mLanguage = lang; 
	unlock(); 
}


std::string User::generateNewPassphrase(Mnemonic* word_source)
{
	auto em = ErrorManager::getInstance();
	static const char* errorMessageForUser = "Ein Fehler, bitte wende dich an den Server-Admin (coin@gradido.net). | An error occured, please ask the server admin (coin@gradido.net).";
	unsigned int random_indices[PHRASE_WORD_COUNT];
	unsigned int str_sizes[PHRASE_WORD_COUNT];
	unsigned int phrase_buffer_size = 0;
	bool errorReloadingMnemonicWordList = false;
	int loopTrys = 0;
	Poco::RegularExpression checkValidWord("^[a-zäöüß]*$");

	// TODO: make sure words didn't double
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		random_indices[i] = randombytes_random() % 2048;
		auto word = word_source->getWord(random_indices[i]);
		if (loopTrys > 10 || errorReloadingMnemonicWordList) {
			return errorMessageForUser;
		}
		if (!word) {
			em->addError(new ParamError("User::generateNewPassphrase", "empty word get for index", random_indices[i]));
			em->sendErrorsAsEmail();

			random_indices[i] = randombytes_random() % 2048;
			word = word_source->getWord(random_indices[i]);
			if (!word) return errorMessageForUser;

		}
		else {
			if (!checkValidWord.match(word, 0, Poco::RegularExpression::RE_NOTEMPTY)) {
				em->addError(new ParamError("User::generateNewPassphrase", "invalid word", word));
				em->addError(new Error("User::generateNewPassphrase", "try to reload mnemonic word list, but this error is maybe evidence for a serious memory problem!!!"));
				if (!ServerConfig::loadMnemonicWordLists()) {
					em->addError(new Error("User::generateNewPassphrase", "error reloading mnemonic word lists"));
					errorReloadingMnemonicWordList = true;
				}
				else {
					i = 0;
					loopTrys++;
				}
				em->sendErrorsAsEmail();
				//return "Server Fehler, bitte frage den Admin coin@gradido.net | Server error, please ask the admin coin@gradido.net";
			}
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

bool User::validatePassphrase(const std::string& passphrase, Mnemonic** wordSource/* = nullptr*/)
{
	std::istringstream iss(passphrase);
	std::vector<std::string> results(std::istream_iterator<std::string>{iss},
								     std::istream_iterator<std::string>());
	for (int i = 0; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) {
		Mnemonic& m = ServerConfig::g_Mnemonic_WordLists[i];
		bool existAll = true;
		for (auto it = results.begin(); it != results.end(); it++) {
			if (!m.isWordExist(*it)) {
				existAll = false;
				continue;
			}
		}
		if (existAll) {
			if (wordSource) {
				*wordSource = &m;
			}
			return true;
		}
	}
	return false;
}

bool User::isEmptyPassword()
{
	bool bRet = false;
	lock("User::isEmptyPassword");
	//printf("[User::isEmptyPassword] pwd hashed: %d, running: %d, this: %d\n",
//		mPasswordHashed, !mCreateCryptoKeyTask.isNull(), this);
	bRet = mPasswordHashed == 0 && (mCreateCryptoKeyTask.isNull() || mCreateCryptoKeyTask->isTaskFinished());
	unlock();
	return bRet;
}

UserStates User::getUserState()
{
	UserStates state;
	lock("User::getUserState");
	state = mState;
	unlock();
	return state;
}

Poco::JSON::Object User::getJson()
{
	lock("User::getJson");
	Poco::JSON::Object userObj;
	
	userObj.set("first_name", mFirstName);
	userObj.set("last_name", mLastName);
	userObj.set("email", mEmail);
	userObj.set("public_hex", mPublicHex);
	userObj.set("state", userStateToString(mState));
	userObj.set("email_checked", mEmailChecked);
	userObj.set("ident_hash", DRMakeStringHash(mEmail.data(), mEmail.size()));
	unlock();
	return userObj;
}

/*
// TODO: if a password and privkey already exist, load current private key and re encrypt with new crypto key
bool User::setNewPassword(const std::string& newPassword)
{
	//Profiler timeUsed;
	if (newPassword == "") {
		lock("User::setNewPassword");
		addError(new Error("Passwort", "Ist leer."));
		unlock();
		return false;
	}
	if (!mCreateCryptoKeyTask.isNull() && !mCreateCryptoKeyTask->isTaskFinished()) {
		lock("User::setNewPassword");
		addError(new Error("Passwort", "Wird bereits erstellt, bitte in ca. 1 minute neuladen."));
		unlock();
		return false;
	}
	duplicate();
	lock("User::setNewPassword");
	//printf("[User::setNewPassword] start create crypto key task with this: %d\n", this);
	mCreateCryptoKeyTask = new UserCreateCryptoKey(this, newPassword, ServerConfig::g_CPUScheduler);
	mCreateCryptoKeyTask->scheduleTask(mCreateCryptoKeyTask);
	unlock();

	duplicate();
	
	UniLib::controller::TaskPtr savePassword(new UserWriteCryptoKeyHashIntoDB(this, 1));
	savePassword->setParentTaskPtrInArray(mCreateCryptoKeyTask, 0);
	savePassword->scheduleTask(savePassword);


	//printf("[User::setNewPassword] timeUsed: %s\n", timeUsed.string().data());
	return true;
}
*/
bool User::updatePassword(const std::string& newPassword, const std::string& passphrase)
{
	static const char* functionName("User::updatePassword");
	if (newPassword == "") {
		lock(functionName);
		addError(new Error(gettext("Passwort"), gettext("Ist leer.")));
		unlock();
		return false;
	}
	if (!mCreateCryptoKeyTask.isNull() && !mCreateCryptoKeyTask->isTaskFinished()) {
		lock(functionName);
		addError(new Error(gettext("Passwort"), gettext("Wird bereits erstellt, bitte in ca. 1 minute neuladen.")));
		unlock();
		return false;
	}
	//duplicate();
	//lock("User::setNewPassword");
	//printf("[User::setNewPassword] start create crypto key task with this: %d\n", this);
	//mCreateCryptoKeyTask = new UserCreateCryptoKey(this, newPassword, ServerConfig::g_CPUScheduler);
	//mCreateCryptoKeyTask->scheduleTask(mCreateCryptoKeyTask);
	//unlock();

	auto mm = MemoryManager::getInstance();

	bool passwordHashedCalculated = false;

	// no previous password set
	if (!mPasswordHashed) {
		duplicate();
		lock(functionName);
		//printf("[User::setNewPassword] start create crypto key task with this: %d\n", this);
		mCreateCryptoKeyTask = new UserCreateCryptoKey(this, newPassword, ServerConfig::g_CPUScheduler);
		mCreateCryptoKeyTask->scheduleTask(mCreateCryptoKeyTask);
		unlock();
	}
	else {
		// compare with previous password
		auto cryptoKey = createCryptoKey(newPassword);
		auto passwordHash = createPasswordHashed(cryptoKey);
		lock(functionName);
		if (mPasswordHashed == passwordHash) {
			addError(new Error(gettext("Passwort"), gettext("Du hast dasselbe Passwort gew&auml;hlt, bitte w&auml;hle ein anderes.")));
			unlock();
			mm->releaseMemory(cryptoKey);
			return false;
		}
		mPasswordHashed = passwordHash;
		passwordHashedCalculated = true;
		if (mCryptoKey) {
			mm->releaseMemory(mCryptoKey);
		}
		mCryptoKey = cryptoKey;
		unlock();
	}

	duplicate();
	UniLib::controller::TaskPtr savePassword(nullptr);
	UserWriteCryptoKeyHashIntoDB* writePWDHashedIntoDB = nullptr;
	if (passwordHashedCalculated) {
		savePassword = new UserWriteCryptoKeyHashIntoDB(this, 0);
	}
	else {
		savePassword = new UserWriteCryptoKeyHashIntoDB(this, 1);
		savePassword->setParentTaskPtrInArray(mCreateCryptoKeyTask, 0);
	}
	savePassword->scheduleTask(savePassword);

	if (passphrase != "") {
		duplicate();
		UniLib::controller::TaskPtr genKeys(new UserGenerateKeys(this, passphrase));
		genKeys->scheduleTask(genKeys);

		
		std::vector<UniLib::controller::TaskPtr> saveKeysParents;
		saveKeysParents.reserve(2); // to prevent allocating more memory as ever needed
		saveKeysParents.push_back(genKeys);
		if (!passwordHashedCalculated) {
			saveKeysParents.push_back(mCreateCryptoKeyTask);
		}
		duplicate();
		UniLib::controller::TaskPtr saveKeys(new UserWriteKeysIntoDB(saveKeysParents, this, true));
		saveKeys->scheduleTask(saveKeys);
	}

	//printf("[User::setNewPassword] timeUsed: %s\n", timeUsed.string().data());
	return true;
}

void User::setEmailChecked()
{
	lock("User::setEmailChecked");
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
	auto mm = MemoryManager::getInstance();
	auto cmpCryptoKey = createCryptoKey(pwd);
	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(User::passwordHashed)");
	}
	User::passwordHashed pwdHashed;
	if (!ServerConfig::g_ServerCryptoKey) {
		if (validationErrorsToPrint) {
			validationErrorsToPrint->addError(new Error("User::validatePwd", "server crypto key not set"));
		}
		mm->releaseMemory(cmpCryptoKey);
		return false;
	}
	crypto_shorthash((unsigned char*)&pwdHashed, *cmpCryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	lock("User::validatePwd");
	if (pwdHashed == mPasswordHashed) {
		if (!mCryptoKey) {
			mCryptoKey = cmpCryptoKey;
		}
		else {
			//delete cmpCryptoKey;
			mm->releaseMemory(cmpCryptoKey);
		}
		unlock();
		return true;
	}
	//delete cmpCryptoKey;
	mm->releaseMemory(cmpCryptoKey);
	
	unlock();
	return false;
}

bool User::validateIdentHash(HASH hash)
{
	lock("User::validateIdentHash");
	HASH local_hash = DRMakeStringHash(mEmail.data(), mEmail.size());
	unlock();
	return local_hash == hash;
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
			lock("User::deleteFromDB");
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
	Poco::Mutex::ScopedLock _lock(mReferenceMutex);
	//mReferenceMutex.lock();
	mReferenceCount++;
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::duplicate] new value: %d\n", mReferenceCount);
#endif
	//mReferenceMutex.unlock();
}

void User::release()
{
	
	Poco::Mutex::ScopedLock _lock(mReferenceMutex);
	//mReferenceMutex.lock();
	mReferenceCount--;
#ifdef DEBUG_USER_DELETE_ENV
	printf("[User::release] new value: %d, this: %d\n", mReferenceCount, this);
#endif
	if (0 == mReferenceCount) {
		//mReferenceMutex.unlock();
		delete this;
		return;
	}
	//mReferenceMutex.unlock();

}

MemoryBin* User::createCryptoKey(const std::string& password)
{

	//Profiler timeUsed;
	auto mm = MemoryManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();
	static const char* funcName = "User::createCryptoKey";
	if (mEmail == "") {
		lock(funcName);
		addError(new Error(funcName, "email is empty"));
		unlock();
		return nullptr;
	}
	
	

	// TODO: put it in secure location, or use value from server config
	static const unsigned char app_secret[] = { 0x21, 0xff, 0xbb, 0xc6, 0x16, 0xfe };

	sha_context context_sha512;
	//unsigned char* hash512 = (unsigned char*)malloc(SHA_512_SIZE);
	if (SHA_512_SIZE < crypto_pwhash_SALTBYTES) {
		lock(funcName);
		addError(new Error(funcName, "sha512 is to small for libsodium pwhash saltbytes"));
		unlock();
		return nullptr;
	}

	observer->addTask(mEmail, TASK_OBSERVER_PASSWORD_CREATION);

	unsigned char hash512_salt[SHA_512_SIZE]; // need at least crypto_pwhash_SALTBYTES 16U
	sha512_init(&context_sha512);
	sha512_update(&context_sha512, (const unsigned char*)mEmail.data(), mEmail.size());
	sha512_update(&context_sha512, app_secret, 6);
	sha512_final(&context_sha512, hash512_salt);


	//unsigned char* key = (unsigned char *)malloc(crypto_box_SEEDBYTES); // 32U
	//ObfusArray* key = new ObfusArray(crypto_box_SEEDBYTES);
	auto key = mm->getFreeMemory(crypto_box_SEEDBYTES);
	//Bin32Bytes* key = mm->get32Bytes();

	if (crypto_pwhash(*key, key->size(), password.data(), password.size(), hash512_salt, 10U, 33554432, 2) != 0) {
		lock(funcName);
		addError(new ParamError(funcName, " error creating pwd hash, maybe to much memory requestet? error:", strerror(errno)));
		unlock();
		observer->removeTask(mEmail, TASK_OBSERVER_PASSWORD_CREATION);
		//printf("[User::%s] error creating pwd hash, maybe to much memory requestet? error: %s\n", __FUNCTION__, strerror(errno));
		//printf("pwd: %s\n", pwd);
		return nullptr;
	}
	observer->removeTask(mEmail, TASK_OBSERVER_PASSWORD_CREATION);
	
//	lock();
//	auto cryptoKey = new ObfusArray(crypto_box_SEEDBYTES, key);
//	unlock();
//	free(key);

	// mCryptoKey
	//printf("[User::createCryptoKey] time used: %s\n", timeUsed.string().data());
	return key;
}

User::passwordHashed User::createPasswordHashed(MemoryBin* cryptoKey, ErrorList* errorReceiver/* = nullptr*/)
{	
	if (sizeof(User::passwordHashed) != crypto_shorthash_BYTES) {
		throw Poco::Exception("crypto_shorthash_BYTES != sizeof(User::passwordHashed)");
	}
	User::passwordHashed pwdHashed = 0;
	if (!ServerConfig::g_ServerCryptoKey) {
		if (errorReceiver) {
			errorReceiver->addError(new Error("User::validatePwd", "server crypto key not set"));
		}
		return pwdHashed;
	}
	crypto_shorthash((unsigned char*)&pwdHashed, *cryptoKey, crypto_box_SEEDBYTES, *ServerConfig::g_ServerCryptoKey);
	
	return pwdHashed;
}

void User::fakeCreateCryptoKey()
{
	Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
}

bool User::generateKeys(bool savePrivkey, const std::string& passphrase, Session* session)
{
	//Profiler timeUsed;
	
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
	std::vector<UniLib::controller::TaskPtr> parentsForWriteKeys;
	parentsForWriteKeys.reserve(2);
	parentsForWriteKeys.push_back(generateKeysTask);
	if (!mCreateCryptoKeyTask.isNull() && !mCreateCryptoKeyTask->isTaskFinished()) {
		parentsForWriteKeys.push_back(mCreateCryptoKeyTask);
	}

	UniLib::controller::TaskPtr saveKeysTask(new UserWriteKeysIntoDB(parentsForWriteKeys, this, savePrivkey));
	saveKeysTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_KEY_PAIR_WRITTEN, session));
	saveKeysTask->scheduleTask(saveKeysTask);


//	printf("[User::generateKeys] call two tasks, time used: %s\n", timeUsed.string().data());
	return true;

}

MemoryBin* User::encrypt(const MemoryBin* data)
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

	//unsigned char* ciphertext = (unsigned char*)malloc(ciphertext_len);
	//ObfusArray* ciphertext = new ObfusArray(ciphertext_len);
	auto mm = MemoryManager::getInstance();
	auto ciphertext = mm->getFreeMemory(ciphertext_len);
	memset(*ciphertext, 0, ciphertext_len);

	if (0 != crypto_secretbox_easy(*ciphertext, *data, message_len, nonce, *mCryptoKey)) {
		//printf("[%s] error encrypting message \n", __FUNCTION__);
		addError(new Error("User::encrypt", "encrypting message failed"));
		//free(ciphertext);
		mm->releaseMemory(ciphertext);

		return nullptr;
	}

	//printf("[User::encrypt] encrypted: %s, ciphertext len: %u\n", KeyPair::getHex(ciphertext, ciphertext_len).data(), ciphertext_len);
	
	//auto resultObfus = new ObfusArray(ciphertext_len, ciphertext);
	//free(ciphertext);
	
	return ciphertext;
}

MemoryBin* User::decrypt(const MemoryBin* encryptedData)
{
	if (!hasCryptoKey()) {
		addError(new Error("User::decrypt", "hasn't crypto key"));
		return nullptr;
	}
	//printf("[User::decrypt] decrypt: %s, ciphertext len: %u\n", KeyPair::getHex(*encryptedData, encryptedData->size()).data(), encryptedData->size());
	//ObfusArray* decrypetData = new ObfusArray(encryptedData->size() - crypto_secretbox_MACBYTES);
	
	size_t decryptSize = encryptedData->size() - crypto_secretbox_MACBYTES;
	//unsigned char* decryptBuffer = (unsigned char*)malloc(decryptSize);
	auto mm = MemoryManager::getInstance();
	//ObfusArray* decryptedData = new ObfusArray(decryptSize);
	auto decryptedData = mm->getFreeMemory(decryptSize);
	unsigned char nonce[crypto_secretbox_NONCEBYTES];
	// we use a hardcoded value for nonce
	memset(nonce, 31, crypto_secretbox_NONCEBYTES);

	if (crypto_secretbox_open_easy(*decryptedData, *encryptedData, encryptedData->size(), nonce, *mCryptoKey)) {
		mm->releaseMemory(decryptedData);
		addError(new Error("User::decrypt", "error decrypting"));
		return nullptr;
	}
	/*int crypto_secretbox_open_easy(unsigned char *m, const unsigned char *c,
		unsigned long long clen, const unsigned char *n,
		const unsigned char *k);*/

	return decryptedData;	
}

MemoryBin* User::sign(const unsigned char* message, size_t messageSize)
{
	
	if (!message || !messageSize) return nullptr;
	if (!hasCryptoKey()) {
		addError(new Error("User::sign", "hasn't crypto key"));
		return nullptr;
	}
	if (!mPrivateKey) {
		addError(new Error("User::sign", "hasn't privkey"));
		return nullptr;
	}

	//binArrayObj = new BinaryArray(crypto_sign_BYTES);
	auto mm = MemoryManager::getInstance();
	//auto signBinBuffer = (unsigned char*)malloc(crypto_sign_BYTES);
	auto privKey = getPrivKey();
	if (!privKey) {
		addError(new Error("User::sign", "decrypt privkey failed"));
		return nullptr;
	}

	auto signBinBuffer = mm->getFreeMemory(crypto_sign_BYTES);
	
	unsigned long long actualSignLength = 0;

	if (crypto_sign_detached(*signBinBuffer, &actualSignLength, message, messageSize, *privKey)) {
		addError(new Error("User::sign", "sign failed"));
		mm->releaseMemory(privKey);
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	if (crypto_sign_verify_detached(*signBinBuffer, message, messageSize, mPublicKey) != 0) {
		// Incorrect signature! 
		//printf("c[KeyBuffer::%s] sign verify failed\n", __FUNCTION__);
		addError(new Error("User::sign", "sign verify failed"));
		mm->releaseMemory(privKey);
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	// debug
	const size_t hex_sig_size = crypto_sign_BYTES * 2 + 1;
	char sig_hex[hex_sig_size];
	sodium_bin2hex(sig_hex, hex_sig_size, *signBinBuffer, crypto_sign_BYTES);
	printf("[User::sign] signature hex: %s\n", sig_hex);
	
	mm->releaseMemory(privKey);

	return signBinBuffer;
}

Poco::Data::Statement User::insertIntoDB(Poco::Data::Session session)
{

	Poco::Data::Statement insert(session);

	//Poco::Data::BLOB pwd(&mPasswordHashed[0], crypto_shorthash_BYTES);

	//printf("[User::insertIntoDB] password hashed: %llu\n", mPasswordHashed);
	std::string languageKey = LanguageManager::keyForLanguage(mLanguage);
	if (mPasswordHashed) {
		insert << "INSERT INTO users (email, first_name, last_name, password, language) VALUES(?, ?, ?, ?, ?);",
			use(mEmail), use(mFirstName), use(mLastName), bind(mPasswordHashed), bind(languageKey);
	}
	else {
		insert << "INSERT INTO users (email, first_name, last_name, language) VALUES(?, ?, ?, ?);",
			use(mEmail), use(mFirstName), use(mLastName), bind(languageKey);
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
		else if (USER_FIELDS_LANGUAGE == fieldType) {
			std::string languageKey = LanguageManager::keyForLanguage(mLanguage);
			update << "UPDATE users SET language = ? where id = ?",
				bind(languageKey), use(mDBId);
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

const char* User::userStateToString(UserStates state)
{
	switch (state) {
	case USER_EMPTY: return "empty";
	case USER_LOADED_FROM_DB: return "loaded from db";
	case USER_PASSWORD_INCORRECT: return "password incorrect";
	case USER_EMAIL_NOT_ACTIVATED: return "email not activated";
	case USER_NO_KEYS: return "no keys";
	case USER_NO_PRIVATE_KEY: return "no private key";
	case USER_COMPLETE: return "complete";
	}
	return "- unknown -";
}

MemoryBin* User::getPrivKey()
{
	if (!mPrivateKey) {
		addError(new Error("User::getPrivKey", "no private key saved"));
		return nullptr;
	}
	if (!hasCryptoKey()) {
		addError(new Error("User::getPrivKey", "no crypto key set for decrypting priv key"));
		return nullptr;
	}
	return decrypt(mPrivateKey);
}

bool User::setPrivKey(const MemoryBin* privKey)
{
	if (!hasCryptoKey()) {
		lock("User::setPrivKey");
		addError(new Error("User::getPrivKey", "no crypto key set for encrypting priv key"));
		unlock();
		return false;
	}
	auto encyrptedPrivKey = encrypt(privKey);
	lock("User::setPrivKey");
	mState = USER_COMPLETE;
	mPrivateKey = encyrptedPrivKey;// encrypt(privKey);
	unlock();

	return true;
}

void User::lock(const char* stateInfos/* = nullptr*/)
{
	try {
		mWorkingMutex.lock(500);
	}
	catch (Poco::TimeoutException& ex) {
		addError(new ParamError("User::lock", "timeout exception", ex.displayText()));
		if (stateInfos) {
			addError(new ParamError("User::lock", "stateInfos", stateInfos));
		}
		sendErrorsAsEmail();
	}
}