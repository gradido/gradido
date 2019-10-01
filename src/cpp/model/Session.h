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

#include "ErrorList.h"
#include "User.h"

#include "../tasks/MultithreadContainer.h"

#include "Poco/Thread.h"
#include "Poco/DateTime.h"
#include "Poco/Net/IPAddress.h"

#define EMAIL_VERIFICATION_CODE_SIZE 8

class WriteEmailVerification;

enum SessionStates {
	SESSION_STATE_CRYPTO_KEY_GENERATED,
	SESSION_STATE_USER_WRITTEN,
	SESSION_STATE_EMAIL_VERIFICATION_WRITTEN,
	SESSION_STATE_EMAIL_VERIFICATION_SEND,
	SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED,
	SESSION_STATE_PASSPHRASE_GENERATED,
	SESSION_STATE_PASSPHRASE_SHOWN,
	SESSION_STATE_KEY_PAIR_GENERATED,
	SESSION_STATE_KEY_PAIR_WRITTEN,
	SESSION_STATE_COUNT
};



class Session : public ErrorList, public UniLib::lib::MultithreadContainer
{
	friend WriteEmailVerification;
public:
	Session(int handle);
	~Session();

	// TODO: automatic redirect after some time, median profiled time for register
	// TODO: register state: written into db, mails sended, update state only if new state is higher as old state
	bool createUser(const std::string& name, const std::string& email, const std::string& password);
	// TODO: check if email exist and if not, fake waiting on password hashing with profiled times of real password hashing
	bool loadUser(const std::string& email, const std::string& password);

	bool loadFromEmailVerificationCode(unsigned long long emailVerificationCode);

	bool updateEmailVerification(unsigned long long emailVerificationCode);

	inline User* getUser() { return mSessionUser; }

	inline int getHandle() { return mHandleId; }
	inline void setPassphrase(const std::string& passphrase) { mPassphrase = passphrase; }
	inline const std::string& getPassphrase() { return mPassphrase; }
	bool generatePassphrase();

	inline void setClientIp(Poco::Net::IPAddress ip) { mClientLoginIP = ip; }
	
	 
	inline bool isIPValid(Poco::Net::IPAddress ip) { return mClientLoginIP == ip; }
	void reset();

	void updateState(SessionStates newState);
	const char* getSessionStateString();
	inline SessionStates getSessionState() { SessionStates s; lock(); s = mState; unlock(); return s; }

	inline unsigned long long getEmailVerificationCode() { return mEmailVerificationCode; }

protected:
	void updateTimeout();
	
	void createEmailVerificationCode();
	

	static const char* translateSessionStateToString(SessionStates state);

	int mHandleId;
	User* mSessionUser;
	std::string mPassphrase;
	Poco::DateTime mLastActivity;
	Poco::Net::IPAddress mClientLoginIP;
	unsigned long long mEmailVerificationCode;

	SessionStates mState;
};


class WriteEmailVerification : public UniLib::controller::CPUTask
{
public:
	WriteEmailVerification(User* user, Session* session, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0)
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user), mSession(session) {}

	virtual const char* getResourceType() const { return "WriteEmailVerification"; };
	virtual int run();

private:
	User* mUser;
	Session* mSession;

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
