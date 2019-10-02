#ifndef GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE 
#define GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE

#include "../Crypto/KeyPair.h"
#include <string>
#include "ErrorList.h"

#include "Poco/Thread.h"
#include "Poco/Data/Session.h"
#include "../tasks/CPUTask.h"

class NewUser;
class UserCreateCryptoKey;
class UserWriteIntoDB;
class Session;

class User : public ErrorList
{
	friend NewUser;
	friend UserCreateCryptoKey;
	friend UserWriteIntoDB;
public:
	// new user
	//User(const char* email, const char* name, const char* password);
	// existing user
	User(const char* email);
	// login
	//User(const std::string& email, const std::string& password);

	~User();

	static std::string generateNewPassphrase(Mnemonic* word_source);
	static bool validatePassphrase(const std::string& passphrase);
	static User* login(const std::string& email, const std::string& password, ErrorList* errorContainer = nullptr);

	bool generateKeys(bool savePrivkey, const std::string& passphrase, Session* session);

	bool loadEntryDBId(Poco::Data::Session session);
	
	inline bool hasCryptoKey() { lock(); bool bRet = mCryptoKey != nullptr; unlock(); return bRet; }
	
	inline const char* getEmail() const { return mEmail.data(); }
	inline const char* getName() const { return mFirstName.data(); }
	inline int         getDBId() const { return mDBId;  }
	inline void		   setEmailChecked() { mEmailChecked = true; }
	inline std::string getPublicKeyHex() { lock(); std::string pubkeyHex = mPublicHex; unlock(); return pubkeyHex; }
	inline void        setPublicKeyHex(const std::string& publicKeyHex) { lock(); mPublicHex = publicKeyHex; unlock(); }

	bool validatePwd(const std::string& pwd);
	
	Poco::Data::BLOB* encrypt(const ObfusArray* data);
protected:
	typedef unsigned long long passwordHashed;

	ObfusArray* createCryptoKey(const std::string& password);
	inline void setCryptoKey(ObfusArray* cryptoKey) { mCryptoKey = cryptoKey; }

	

	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	inline passwordHashed getPwdHashed() { lock(); auto ret = mPasswordHashed; unlock(); return ret; }
	inline void setPwdHashed(passwordHashed pwdHashed) { lock(); mPasswordHashed = pwdHashed; unlock(); }

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

private:
	int mDBId;
	std::string mEmail;
	std::string mFirstName;
	
	passwordHashed mPasswordHashed;
	bool mEmailChecked;
	// crypto key as obfus array 
	ObfusArray* mCryptoKey;
	std::string mPublicHex;
	Poco::Mutex mWorkingMutex;
	
};

class UserCreateCryptoKey : public UniLib::controller::CPUTask
{
public:
	UserCreateCryptoKey(User* user, const std::string& password, UniLib::controller::CPUSheduler* cpuScheduler)
		: UniLib::controller::CPUTask(cpuScheduler), mUser(user), mPassword(password)  {}

	virtual int run();
	virtual const char* getResourceType() const { return "UserCreateCryptoKey"; };

private:
	User* mUser;
	std::string mPassword;
};

class UserGenerateKeys : public UniLib::controller::CPUTask
{
public:
	UserGenerateKeys(User* user, const std::string& passphrase)
		: mUser(user), mPassphrase(passphrase) {}

	~UserGenerateKeys() {

	}
	virtual int run();
	inline KeyPair* getKeyPairs() { return &mKeys; }

	virtual const char* getResourceType() const { return "UserGenerateKeys"; };
protected:
	User* mUser;
	std::string mPassphrase;
	KeyPair mKeys;
};

class UserWriteIntoDB : public UniLib::controller::CPUTask
{
public:
	UserWriteIntoDB(User* user, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0)
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user) {}

	virtual int run();
	virtual const char* getResourceType() const { return "UserWriteIntoDB"; };
private: 
	User* mUser;
};

class UserWriteKeysIntoDB : public UniLib::controller::CPUTask
{
public:
	UserWriteKeysIntoDB(UniLib::controller::TaskPtr  parent, User* user, bool savePrivKey);

	virtual int run();

	virtual const char* getResourceType() const { return "UserWriteKeysIntoDB"; };
protected:
	User* mUser;
	bool mSavePrivKey;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE