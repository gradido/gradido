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

class User : public ErrorList
{
	friend NewUser;
	friend UserCreateCryptoKey;
	friend UserWriteIntoDB;
public:
	// new user
	//User(const char* email, const char* name, const char* password);
	// existing user
	User(const char* email, const char* name);

	~User();

	static std::string generateNewPassphrase(Mnemonic* word_source);
	
	inline bool hasCryptoKey() { lock(); bool bRet = mCryptoKey != nullptr; unlock(); return bRet; }
	inline const char* getEmail() const { return mEmail.data(); }
	inline const char* getName() const { return mFirstName.data(); }
	inline int         getDBId() { return mDBId;  }

	
protected:
	void createCryptoKey(const std::string& password);
	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	bool loadEntryDBId(Poco::Data::Session session);

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

private:
	int mDBId;
	std::string mEmail;
	std::string mFirstName;
	unsigned char mPasswordHashed[crypto_shorthash_BYTES];
	// crypto key as obfus array 
	ObfusArray* mCryptoKey;

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


class NewUser : public Poco::Runnable
{
public:
	NewUser(User* user, const char* password, const char* passphrase);
	~NewUser();


	virtual void run();
protected:
	User*       mUser;
	std::string mPassword;
	std::string mPassphrase;

};

class LoginUser : public Poco::Runnable
{
public: 
	LoginUser(User* user, const char* password);
	~LoginUser();

	virtual void run();
protected:
	User*       mUser;
	std::string mPassword;

};

#endif //GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE