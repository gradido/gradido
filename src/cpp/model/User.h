#ifndef GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE 
#define GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE

#include "../Crypto/KeyPair.h"
#include <string>
#include "ErrorList.h"

#include "Poco/Thread.h"
#include "Poco/Types.h"
#include "Poco/Data/Session.h"
#include "../tasks/CPUTask.h"

class NewUser;
class UserCreateCryptoKey;
class UserWriteIntoDB;
class Session;
class UserWriteCryptoKeyHashIntoDB;


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
	//static User* login(const std::string& email, const std::string& password, ErrorList* errorContainer = nullptr);

	bool generateKeys(bool savePrivkey, const std::string& passphrase, Session* session);

	bool loadEntryDBId(Poco::Data::Session session);
	
	bool deleteFromDB();
	
	inline bool hasCryptoKey() { lock(); bool bRet = mCryptoKey != nullptr; unlock(); return bRet; }
	
	inline const char* getEmail() const { return mEmail.data(); }
	inline const char* getFirstName() const { return mFirstName.data(); }
	inline const char* getLastName() const { return mLastName.data(); }
	inline int         getDBId() const { return mDBId;  }
	inline void		   setEmailChecked() { mEmailChecked = true; }
	inline bool        isEmailChecked() { return mEmailChecked; }
	inline std::string getPublicKeyHex() { lock(); std::string pubkeyHex = mPublicHex; unlock(); return pubkeyHex; }
	inline void        setPublicKeyHex(const std::string& publicKeyHex) { lock(); mPublicHex = publicKeyHex; unlock(); }

	bool isEmptyPassword();
	bool setNewPassword(const std::string& newPassword);
	bool validatePwd(const std::string& pwd, ErrorList* validationErrorsToPrint);
	
	Poco::Data::BLOB* encrypt(const ObfusArray* data);

	// for poco auto ptr
	void duplicate();
	void release();
protected:
	typedef Poco::UInt64 passwordHashed;

	ObfusArray* createCryptoKey(const std::string& password);
	inline void setCryptoKey(ObfusArray* cryptoKey) { lock(); mCryptoKey = cryptoKey; unlock(); }

	

	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	bool updateIntoDB(const char* fieldName);
	inline passwordHashed getPwdHashed() { lock(); auto ret = mPasswordHashed; unlock(); return ret; }
	inline void setPwdHashed(passwordHashed pwdHashed) { lock(); mPasswordHashed = pwdHashed; unlock(); }

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

	

private:
	int mDBId;
	std::string mEmail;
	std::string mFirstName;
	std::string mLastName;
	
	passwordHashed mPasswordHashed;
	bool mEmailChecked;
	// crypto key as obfus array 
	ObfusArray* mCryptoKey;
	std::string mPublicHex;
	Poco::Mutex mWorkingMutex;
	
	// for poco auto ptr
	int mReferenceCount;

	UniLib::controller::TaskPtr mCreateCryptoKeyTask;
};

class UserCreateCryptoKey : public UniLib::controller::CPUTask
{
public:
	UserCreateCryptoKey(Poco::AutoPtr<User> user, const std::string& password, UniLib::controller::CPUSheduler* cpuScheduler)
		: UniLib::controller::CPUTask(cpuScheduler), mUser(user), mPassword(password)  {}

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
		: mUser(user), mPassphrase(passphrase) {}

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
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user) {}

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