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
#include "../controller/User.h"

#include "../lib/MultithreadContainer.h"
#include "../tasks/ProcessingTransaction.h"

#include "../SingletonManager/LanguageManager.h"

#include "../controller/EmailVerificationCode.h"

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
	SESSION_STATE_RESET_PASSWORD_REQUEST,
	SESSION_STATE_RESET_PASSWORD_SUCCEED,
	SESSION_STATE_COUNT
};

class SessionManager;
class UpdateUserPasswordPage;
class PassphrasePage;
class RepairDefectPassphrase;

class Session : public ErrorList, public UniLib::lib::MultithreadContainer
{
	friend WriteEmailVerification;
	friend SessionManager;
	friend UpdateUserPasswordPage;
	friend PassphrasePage;
	friend RepairDefectPassphrase;
public:
	Session(int handle);
	~Session();

	// get new model objects
	Poco::AutoPtr<controller::EmailVerificationCode> getEmailVerificationCodeObject();

	// set new model objects
	inline void setUser(Poco::AutoPtr<controller::User> user) { mNewUser = user; }
	inline Poco::AutoPtr<controller::User> getNewUser() { return mNewUser; }

	// ----------------  User functions ----------------------------
	// TODO: register state: written into db, mails sended, update state only if new state is higher as old state
	// create User send e-mail activation link
	bool createUser(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password);

	//! \brief new register function, without showing user pubkeys, using controller/user
	bool createUserDirect(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password);


	// adminRegister without passwort
	bool adminCreateUser(const std::string& first_name, const std::string& last_name, const std::string& email);

	// TODO: check if email exist and if not, fake waiting on password hashing with profiled times of real password hashing
	UserStates loadUser(const std::string& email, const std::string& password);
	bool ifUserExist(const std::string& email);

	inline void setUser(Poco::AutoPtr<User> user) { mSessionUser = user; }
	
	
	bool deleteUser();

	Poco::AutoPtr<User> getUser() {
		return mSessionUser;
	}

	// ------------------------- Email Verification Code functions -------------------------------

	bool loadFromEmailVerificationCode(Poco::UInt64 emailVerificationCode);

	//! \return 1 = konto already exist
	//!        -1 = invalid code
	//!        -2 = critical error
	//!         0 = ok
	int updateEmailVerification(Poco::UInt64 emailVerificationCode);

	// called from page with same name
	//! \return 1 = reset password email already send
	//! \return 0 = ok
	int resetPassword(Poco::AutoPtr<controller::User> user, bool passphraseMemorized);
	// 
	//! \return 0 = not the same
	//! \return 1 = same
	//! \return -1 = error
	//!  \return -2 = critical error
	int comparePassphraseWithSavedKeys(const std::string& inputPassphrase, Mnemonic* wordSource);

	Poco::Net::HTTPCookie getLoginCookie();

	
	inline int getHandle() { return mHandleId; }

	// ------------------------ Passphrase functions ----------------------------
	
	inline void setPassphrase(Poco::AutoPtr<Passphrase> passphrase) { mNewPassphrase = passphrase; }
	inline Poco::AutoPtr<Passphrase> getPassphrase() { return mNewPassphrase; }

	inline void setPassphrase(const std::string& passphrase) { mPassphrase = passphrase; }
	
	inline const std::string& getOldPassphrase() { return mPassphrase; }
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

	inline Poco::UInt64 getEmailVerificationCode() { if (mEmailVerificationCodeObject.isNull()) return 0; return mEmailVerificationCodeObject->getModel()->getCode(); }
	inline model::table::EmailOptInType getEmailVerificationType() {
		if (mEmailVerificationCodeObject.isNull()) return model::table::EMAIL_OPT_IN_EMPTY;
		return mEmailVerificationCodeObject->getModel()->getType();
	}

	inline bool isActive() { bool bret = false; lock("Session::isActive"); bret = mActive; unlock(); return bret; }
	inline void setActive(bool active) { lock("Sessions::setActive");  mActive = active; unlock(); }

	inline Poco::DateTime getLastActivity() { return mLastActivity; }

	// ------------------------ transactions functions ----------------------------

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

	// last referer
	inline void setLastReferer(const std::string& lastReferer) { mLastExternReferer = lastReferer; }
	inline const std::string& getLastReferer() const { return mLastExternReferer; }

protected:
	void updateTimeout();
	inline void setHandle(int newHandle) { mHandleId = newHandle; }
	
	void detectSessionState();
	static const char* translateSessionStateToString(SessionStates state);

	inline const std::string& getPassphrase() const { return mPassphrase; }
	

private: 
	int mHandleId;
	Poco::AutoPtr<User> mSessionUser;
	Poco::AutoPtr<controller::User> mNewUser;
	std::string mPassphrase;
	Poco::AutoPtr<Passphrase> mNewPassphrase;
	Poco::DateTime mLastActivity;
	Poco::Net::IPAddress mClientLoginIP;
	std::string          mLastExternReferer;
	Poco::AutoPtr<controller::EmailVerificationCode> mEmailVerificationCodeObject;


	SessionStates mState;

	bool mActive;
	std::list<Poco::AutoPtr<ProcessingTransaction>> mProcessingTransactions;
	Poco::AutoPtr<ProcessingTransaction> mCurrentActiveProcessingTransaction;

	Poco::AutoPtr<LanguageCatalog> mLanguageCatalog;
};


class WriteEmailVerification : public UniLib::controller::CPUTask
{
public:
	WriteEmailVerification(Poco::AutoPtr<User> user, Poco::AutoPtr<controller::EmailVerificationCode> emailVerificationCode, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0)
		: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount), mUser(user), mEmailVerificationCode(emailVerificationCode) {
#ifdef _UNI_LIB_DEBUG
		setName(user->getEmail());
#endif
	}

	virtual const char* getResourceType() const { return "WriteEmailVerification"; };
	virtual int run();

private:
	Poco::AutoPtr<User> mUser;
	Poco::AutoPtr<controller::EmailVerificationCode> mEmailVerificationCode;

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
