#ifndef GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE 
#define GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE

#include "../Crypto/KeyPair.h"
#include <string>
//#include "ModelBase.h"
#include "../lib/ErrorList.h"

#include "Poco/Thread.h"
#include "Poco/Types.h"
#include "Poco/Data/Session.h"
#include "Poco/JSON/Object.h"
#include "../tasks/CPUTask.h"

#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/LanguageManager.h"

#include "../controller/User.h"

class UserCreateCryptoKey;
class UserWriteIntoDB;
class Session;
class UserWriteCryptoKeyHashIntoDB;
class SigningTransaction;
class UserGenerateKeys;
class DebugPassphrasePage;

enum UserStates
{
	USER_EMPTY,
	USER_LOADED_FROM_DB,
	USER_PASSWORD_INCORRECT,
	USER_PASSWORD_ENCRYPTION_IN_PROCESS,
	USER_EMAIL_NOT_ACTIVATED,
	USER_NO_KEYS,
	USER_NO_PRIVATE_KEY,
	USER_COMPLETE
};

enum UserFields
{
	USER_FIELDS_ID,
	USER_FIELDS_FIRST_NAME,
	USER_FIELDS_LAST_NAME,
	USER_FIELDS_PASSWORD,
	USER_FIELDS_EMAIL_CHECKED,
	USER_FIELDS_LANGUAGE
};

class User : public ErrorList
{
	friend UserCreateCryptoKey;
	friend UserWriteIntoDB;
	friend UserWriteCryptoKeyHashIntoDB;
	friend SigningTransaction;
	friend UserGenerateKeys;
	friend DebugPassphrasePage;
public:
	// new user
	User(const char* email, const char* first_name, const char* last_name);
	// existing user
	User(const char* email);

	// existing user by public key
	User(const unsigned char* pubkey_array);

	User(int user_id);

	// load from controller user
	User(Poco::AutoPtr<controller::User> ctrl_user);

	// login
	//User(const std::string& email, const std::string& password);

	~User();

	static std::string generateNewPassphrase(Mnemonic* word_source);
	static bool validatePassphrase(const std::string& passphrase, Mnemonic** wordSource = nullptr);
	static const char* userStateToString(UserStates state);
	//static User* login(const std::string& email, const std::string& password, ErrorList* errorContainer = nullptr);

	bool generateKeys(bool savePrivkey, const std::string& passphrase, Session* session);

	bool loadEntryDBId(Poco::Data::Session session);
	
	bool deleteFromDB();
	
	inline bool hasCryptoKey() { lock(); bool bRet = mCryptoKey != nullptr; unlock(); return bRet; }
	
	inline const char* getEmail() const { return mEmail.data(); }
	inline const char* getFirstName() const { return mFirstName.data(); }
	inline const char* getLastName() const { return mLastName.data(); }
	inline int         getDBId() const { return mDBId;  }
	inline int         getBalance() { lock(); int balance = mGradidoCurrentBalance; unlock(); return balance; }
	inline std::string getPublicKeyHex() { lock(); std::string pubkeyHex = mPublicHex; unlock(); return pubkeyHex; }
	inline const unsigned char* getPublicKey() { return mPublicKey; }
	inline Languages   getLanguage() { lock(); Languages lang = mLanguage; unlock(); return lang; }

	inline void        setPublicKeyHex(const std::string& publicKeyHex) { lock(); mPublicHex = publicKeyHex; unlock(); }
	inline void		   setPublicKey(const unsigned char* key) { lock(); memcpy(mPublicKey, key, crypto_sign_PUBLICKEYBYTES); unlock();}

	inline const char* gettext(const char* text) { if (mLanguageCatalog.isNull()) return text; return mLanguageCatalog->gettext(text); }

	UserStates         getUserState();

	void setLanguage(Languages lang);
	inline void setBalance(int balance) { lock(); mGradidoCurrentBalance = balance; unlock(); }
	void setEmailChecked();
	bool isEmptyPassword();
	//bool setNewPassword(const std::string& newPassword);
	bool updatePassword(const std::string& newPassword, const std::string& passphrase, Poco::AutoPtr<controller::User> newUser);
	bool validatePwd(const std::string& pwd, ErrorList* validationErrorsToPrint);
	bool validateIdentHash(HASH hash);
	
	MemoryBin* encrypt(const MemoryBin* data);
	MemoryBin* decrypt(const MemoryBin* encryptedData);
	MemoryBin* sign(const unsigned char* message, size_t messageSize);

	Poco::JSON::Object getJson();

	// for poco auto ptr
	void duplicate();
	void release();

	//! \brief wait time create crypto key is normally running
	static void fakeCreateCryptoKey();
protected:
	typedef Poco::UInt64 passwordHashed;

	MemoryBin* createCryptoKey(const std::string& password);
	static passwordHashed createPasswordHashed(MemoryBin* cryptoKey, ErrorList* errorReceiver = nullptr);
	inline void setCryptoKey(MemoryBin* cryptoKey) { lock(); mCryptoKey = cryptoKey; unlock(); }

	//void detectState();

	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	bool updateIntoDB(UserFields fieldType);
	inline passwordHashed getPwdHashed() { lock(); auto ret = mPasswordHashed; unlock(); return ret; }
	inline void setPwdHashed(passwordHashed pwdHashed) { lock(); mPasswordHashed = pwdHashed; unlock(); }

	void lock(const char* stateInfos = nullptr);
	inline void unlock() { mWorkingMutex.unlock(); }

	MemoryBin* getPrivKey();
	inline bool hasPrivKey() { lock(); bool result = false; if (mPrivateKey && mCryptoKey) result = true; unlock(); return result; }
	bool setPrivKey(const MemoryBin* privKey);

private:
	Poco::AutoPtr<controller::User> mUserCtrl;
	UserStates mState;

	// ************************* DB FIELDS ******************************
	int mDBId;
	std::string mEmail;
	std::string mFirstName;
	std::string mLastName;
	
	passwordHashed mPasswordHashed;
	
	std::string mPublicHex;
	unsigned char mPublicKey[crypto_sign_PUBLICKEYBYTES];
	MemoryBin* mPrivateKey;
	// TODO: insert created if necessary

	bool mEmailChecked;
	Languages mLanguage;

	// ************************ DB FIELDS END ******************************
	
	int mGradidoCurrentBalance;
	Poco::AutoPtr<LanguageCatalog> mLanguageCatalog;

	// crypto key as obfus array 
	// only in memory, if user has typed in password
	MemoryBin* mCryptoKey;

	Poco::Mutex mWorkingMutex;
	Poco::Mutex mReferenceMutex;
	
	// for poco auto ptr
	int mReferenceCount;

	UniLib::controller::TaskPtr mCreateCryptoKeyTask;
};

class UserCreateCryptoKey : public UniLib::controller::CPUTask
{
public:
	UserCreateCryptoKey(Poco::AutoPtr<User> user, Poco::AutoPtr<controller::User> newUser, const std::string& password, UniLib::controller::CPUSheduler* cpuScheduler);

	virtual int run();
	virtual const char* getResourceType() const { return "UserCreateCryptoKey"; };

private:
	Poco::AutoPtr<User> mUser;
	Poco::AutoPtr<controller::User> mNewUser;
	std::string mPassword;
};

class UserGenerateKeys : public UniLib::controller::CPUTask
{
public:
	UserGenerateKeys(Poco::AutoPtr<User> user, Poco::AutoPtr<controller::User> newUser, const std::string& passphrase)
		: mUser(user), mNewUser(newUser), mPassphrase(passphrase) {
#ifdef _UNI_LIB_DEBUG
		setName(user->getEmail());
#endif
	}

	~UserGenerateKeys() {

	}
	virtual int run();
	inline KeyPair* getKeyPairs() { return &mKeys; }

	virtual const char* getResourceType() const { return "UserGenerateKeys"; };
protected:
	Poco::AutoPtr<User> mUser;
	Poco::AutoPtr<controller::User> mNewUser;
	std::string mPassphrase;
	KeyPair mKeys;
};

class UserWriteIntoDB : public UniLib::controller::CPUTask
{
public:
	UserWriteIntoDB(Poco::AutoPtr<User> user, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0)
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user) {
#ifdef _UNI_LIB_DEBUG
		setName(user->getEmail());
#endif
	}

	virtual int run();
	virtual const char* getResourceType() const { return "UserWriteIntoDB"; };
private: 
	Poco::AutoPtr<User> mUser;
};

class UserWriteKeysIntoDB : public UniLib::controller::CPUTask
{
public:
	UserWriteKeysIntoDB(std::vector<UniLib::controller::TaskPtr> parents, Poco::AutoPtr<User> user, bool savePrivKey);

	virtual int run();

	virtual const char* getResourceType() const { return "UserWriteKeysIntoDB"; };
protected:
	Poco::AutoPtr<User> mUser;
	bool mSavePrivKey;
};

class UserWriteCryptoKeyHashIntoDB : public UniLib::controller::CPUTask
{
public:
	UserWriteCryptoKeyHashIntoDB(Poco::AutoPtr<User> user, int dependencieCount = 0);

	int run();
	const char* getResourceType() const { return "UserWriteCryptoKeyHashIntoDB"; };

protected:
	Poco::AutoPtr<User> mUser;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE