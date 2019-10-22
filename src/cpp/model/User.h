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

class NewUser;
class UserCreateCryptoKey;
class UserWriteIntoDB;
class Session;
class UserWriteCryptoKeyHashIntoDB;


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
	USER_FIELDS_EMAIL_CHECKED
};

class User : public ErrorList
{
	friend NewUser;
	friend UserCreateCryptoKey;
	friend UserWriteIntoDB;
	friend UserWriteCryptoKeyHashIntoDB;
public:
	// new user
	User(const char* email, const char* first_name, const char* last_name);
	// existing user
	User(const char* email);

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
	inline std::string getPublicKeyHex() { lock(); std::string pubkeyHex = mPublicHex; unlock(); return pubkeyHex; }
	inline void        setPublicKeyHex(const std::string& publicKeyHex) { lock(); mPublicHex = publicKeyHex; unlock(); }

	UserStates         getUserState();

	void setEmailChecked();
	bool isEmptyPassword();
	bool setNewPassword(const std::string& newPassword);
	bool validatePwd(const std::string& pwd, ErrorList* validationErrorsToPrint);
	
	Poco::Data::BLOB* encrypt(const ObfusArray* data);

	Poco::JSON::Object getJson();

	// for poco auto ptr
	void duplicate();
	void release();
protected:
	typedef Poco::UInt64 passwordHashed;

	ObfusArray* createCryptoKey(const std::string& password);
	inline void setCryptoKey(ObfusArray* cryptoKey) { lock(); mCryptoKey = cryptoKey; unlock(); }

	void detectState();

	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	bool updateIntoDB(UserFields fieldType);
	inline passwordHashed getPwdHashed() { lock(); auto ret = mPasswordHashed; unlock(); return ret; }
	inline void setPwdHashed(passwordHashed pwdHashed) { lock(); mPasswordHashed = pwdHashed; unlock(); }

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

	

private:
	UserStates mState;

	// ************************* DB FIELDS ******************************
	int mDBId;
	std::string mEmail;
	std::string mFirstName;
	std::string mLastName;
	
	passwordHashed mPasswordHashed;
	
	std::string mPublicHex;
	ObfusArray* mPrivateKey;
	// TODO: insert created if necessary

	bool mEmailChecked;

	// ************************ DB FIELDS END ******************************
	// crypto key as obfus array 
	// only in memory, if user has typed in password
	ObfusArray* mCryptoKey;

	Poco::Mutex mWorkingMutex;
	
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