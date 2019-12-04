#ifndef GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE 
#define GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE

#include "../Crypto/KeyPair.h"
#include <string>
#include "ModelBase.h"

#include "Poco/Thread.h"
#include "Poco/Types.h"
#include "Poco/Data/Session.h"
#include "Poco/JSON/Object.h"
#include "../tasks/CPUTask.h"

#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/LanguageManager.h"

class UserCreateCryptoKey;
class UserWriteIntoDB;
class Session;
class UserWriteCryptoKeyHashIntoDB;
class SigningTransaction;
class UserGenerateKeys;


enum UserStates
{
	USER_EMPTY,
	USER_LOADED_FROM_DB,
	USER_PASSWORD_INCORRECT,
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
public:
	// new user
	User(const char* email, const char* first_name, const char* last_name);
	// existing user
	User(const char* email);

	// existing user by public key
	User(const unsigned char* pubkey_array);

	User(int user_id);
	// login
	//User(const std::string& email, const std::string& password);

	~User();

	static std::string generateNewPassphrase(Mnemonic* word_source);
	static bool validatePassphrase(const std::string& passphrase);
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

	UserStates         getUserState();

	void setLanguage(Languages lang) { lock(); mLanguage = lang; unlock(); }
	inline void setBalance(int balance) { lock(); mGradidoCurrentBalance = balance; unlock(); }
	void setEmailChecked();
	bool isEmptyPassword();
	bool setNewPassword(const std::string& newPassword);
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
	inline void setCryptoKey(MemoryBin* cryptoKey) { lock(); mCryptoKey = cryptoKey; unlock(); }

	//void detectState();

	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	bool updateIntoDB(UserFields fieldType);
	inline passwordHashed getPwdHashed() { lock(); auto ret = mPasswordHashed; unlock(); return ret; }
	inline void setPwdHashed(passwordHashed pwdHashed) { lock(); mPasswordHashed = pwdHashed; unlock(); }

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

	MemoryBin* getPrivKey();
	inline bool hasPrivKey() { lock(); bool result = false; if (mPrivateKey && mCryptoKey) result = true; unlock(); return result; }
	bool setPrivKey(const MemoryBin* privKey);

private:
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
	UserCreateCryptoKey(Poco::AutoPtr<User> user, const std::string& password, UniLib::controller::CPUSheduler* cpuScheduler)
		: UniLib::controller::CPUTask(cpuScheduler), mUser(user), mPassword(password)  {
#ifdef _UNI_LIB_DEBUG
		setName(user->getEmail());
#endif
	}

	virtual int run();
	virtual const char* getResourceType() const { return "UserCreateCryptoKey"; };

private:
	Poco::AutoPtr<User> mUser;
	std::string mPassword;
};

class UserGenerateKeys : public UniLib::controller::CPUTask
{
public:
	UserGenerateKeys(Poco::AutoPtr<User> user, const std::string& passphrase)
		: mUser(user), mPassphrase(passphrase) {
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
	UserWriteKeysIntoDB(UniLib::controller::TaskPtr  parent, Poco::AutoPtr<User> user, bool savePrivKey);

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