#ifndef GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE 
#define GRADIDO_LOGIN_SERVER_MODEL_USER_INCLUDE

#include "../Crypto/KeyPair.h"
#include <string>
#include "ErrorList.h"
#include "Poco/Thread.h"

class NewUser;

class User : public ErrorList
{
	friend NewUser;
public:
	// new user
	User(const char* email, const char* name, const char* password, const char* passphrase);
	// existing user
	User(const char* email, const char* password);

	~User();

	static std::string generateNewPassphrase(Mnemonic* word_source);
	
	inline bool hasCryptoKey() { lock(); bool bRet = mCryptoKey != nullptr; unlock(); return bRet; }
	inline const char* getEmail()  { return mEmail.data(); }

	
protected:
	void createCryptoKey(const char* email, const char* password);

	inline void lock() { mWorkingMutex->lock(); }
	inline void unlock() { mWorkingMutex->unlock(); }

private:
	std::string mEmail;
	std::string mFirstName;
	// crypto key as obfus array 
	ObfusArray* mCryptoKey;

	Poco::Mutex* mWorkingMutex;
	
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