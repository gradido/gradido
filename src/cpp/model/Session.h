/*!
*
* \author: einhornimmond
*
* \date: 02.03.19
*
* \brief: store session data
*/

#ifndef DR_LUA_WEB_MODULE_SESSION_SESSION_H
#define DR_LUA_WEB_MODULE_SESSION_SESSION_H

#include "../lib/ErrorList.h"
#include "User.h"

#include "../lib/MultithreadContainer.h"
#include "../tasks/ProcessingTransaction.h"

#include "../SingletonManager/LanguageManager.h"

#include "Poco/Thread.h"
#include "Poco/Types.h"
#include "Poco/DateTime.h"
#include "Poco/Net/IPAddress.h"
#include "Poco/Net/HTTPCookie.h"




class WriteEmailVerification;

enum SessionStates {
	SESSION_STATE_EMPTY,
	SESSION_STATE_CRYPTO_KEY_GENERATED,
	SESSION_STATE_USER_WRITTEN,
	SESSION_STATE_EMAIL_VERIFICATION_WRITTEN,
	SESSION_STATE_EMAIL_VERIFICATION_SEND,
	SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED,
	SESSION_STATE_PASSPHRASE_GENERATED,
	SESSION_STATE_PASSPHRASE_SHOWN,
	SESSION_STATE_PASSPHRASE_WRITTEN,
	SESSION_STATE_KEY_PAIR_GENERATED,
	SESSION_STATE_KEY_PAIR_WRITTEN,
	SESSION_STATE_COUNT
};

class SessionManager;

class Session : public ErrorList, public UniLib::lib::MultithreadContainer
{
	friend WriteEmailVerification;
	friend SessionManager;
public:
	Session(int handle);
	~Session();

	// TODO: automatic redirect after some time, median profiled time for register
	// TODO: register state: written into db, mails sended, update state only if new state is higher as old state
	bool createUser(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password);
	// TODO: check if email exist and if not, fake waiting on password hashing with profiled times of real password hashing
	UserStates loadUser(const std::string& email, const std::string& password);

	inline void setUser(Poco::AutoPtr<User> user) { mSessionUser = user; }
	
	bool deleteUser();

	bool loadFromEmailVerificationCode(Poco::UInt64 emailVerificationCode);

	//! \return 1 = konto already exist
	//!        -1 = invalid code
	//!        -2 = critical error
	//!         0 = ok
	int updateEmailVerification(Poco::UInt64 emailVerificationCode);

	

	Poco::Net::HTTPCookie getLoginCookie();

	Poco::AutoPtr<User> getUser() { 
		return mSessionUser; 
	}

	inline int getHandle() { return mHandleId; }
	
	inline void setPassphrase(const std::string& passphrase) { mPassphrase = passphrase; }
	inline const std::string& getPassphrase() { return mPassphrase; }
	bool generatePassphrase();
	bool generateKeys(bool savePrivkey, bool savePassphrase);

	inline void setClientIp(Poco::Net::IPAddress ip) { mClientLoginIP = ip; }
	inline Poco::Net::IPAddress getClientIp() { return mClientLoginIP; }
	 
	inline bool isIPValid(Poco::Net::IPAddress ip) { return mClientLoginIP == ip; }
	bool isPwdValid(const std::string& pwd);
	void reset();

	void updateState(SessionStates newState);
	const char* getSessionStateString();
	inline SessionStates getSessionState() { SessionStates s; lock("Session::getSessionState"); s = mState; unlock(); return s; }

	inline Poco::UInt64 getEmailVerificationCode() { return mEmailVerificationCode; }

	inline bool isActive() { bool bret = false; lock("Session::isActive"); bret = mActive; unlock(); return bret; }
	inline void setActive(bool active) { lock("Sessions::setActive");  mActive = active; unlock(); }

	inline Poco::DateTime getLastActivity() { return mLastActivity; }

	//! \return true if succeed
	bool startProcessingTransaction(const std::string& proto_message_base64);
	//! \param working if set will filled with transaction running
	Poco::AutoPtr<ProcessingTransaction> getNextReadyTransaction(size_t* working = nullptr);
	void finalizeTransaction(bool sign, bool reject);
	size_t getProcessingTransactionCount();

	inline LanguageCatalog* getLanguageCatalog() { return mLanguageCatalog.isNull() ? nullptr : mLanguageCatalog; }
	void setLanguage(Languages lang);
	inline void setLanguageCatalog(Poco::AutoPtr<LanguageCatalog> languageCatalog) { mLanguageCatalog = languageCatalog; }
	Languages getLanguage();
	inline const char* gettext(const char* text) { if (mLanguageCatalog.isNull()) return text; return mLanguageCatalog->gettext(text); }

protected:
	void updateTimeout();
	inline void setHandle(int newHandle) { mHandleId = newHandle; }
	
	void createEmailVerificationCode();
	
	void detectSessionState();
	static const char* translateSessionStateToString(SessionStates state);

	

private: 
	int mHandleId;
	Poco::AutoPtr<User> mSessionUser;
	std::string mPassphrase;
	Poco::DateTime mLastActivity;
	Poco::Net::IPAddress mClientLoginIP;
	Poco::UInt64 mEmailVerificationCode;

	SessionStates mState;

	bool mActive;
	std::list<Poco::AutoPtr<ProcessingTransaction>> mProcessingTransactions;
	Poco::AutoPtr<ProcessingTransaction> mCurrentActiveProcessingTransaction;

	Poco::AutoPtr<LanguageCatalog> mLanguageCatalog;
};


class WriteEmailVerification : public UniLib::controller::CPUTask
{
public:
	WriteEmailVerification(Poco::AutoPtr<User> user, Poco::UInt64 emailVerificationCode, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0)
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user), mEmailVerificationCode(emailVerificationCode) {
#ifdef _UNI_LIB_DEBUG
		setName(user->getEmail());
#endif
	}

	virtual const char* getResourceType() const { return "WriteEmailVerification"; };
	virtual int run();

private:
	Poco::AutoPtr<User> mUser;
	Poco::UInt64 mEmailVerificationCode;

};

class WritePassphraseIntoDB : public UniLib::controller::CPUTask
{
public:
	WritePassphraseIntoDB(int userId, const std::string& passphrase)
		: mUserId(userId), mPassphrase(passphrase) {
#ifdef _UNI_LIB_DEBUG
		setName(std::to_string(userId).data());
#endif
	}


	virtual int run();
	virtual const char* getResourceType() const { return "WritePassphraseIntoDB"; };

protected:
	int mUserId;
	std::string mPassphrase;
};

class SessionStateUpdateCommand : public UniLib::controller::Command
{
public:
	SessionStateUpdateCommand(SessionStates state, Session* session)
		: mState(state), mSession(session) {}
	virtual int taskFinished(UniLib::controller::Task* task) {
		mSession->updateState(mState);
		return 0;
	}

protected:
	SessionStates mState;
	Session* mSession;
};

#endif // DR_LUA_WEB_MODULE_SESSION_SESSION_H
