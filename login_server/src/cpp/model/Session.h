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

#include "../lib/NotificationList.h"
#include "../controller/User.h"

#include "../lib/MultithreadContainer.h"

#include "../SingletonManager/LanguageManager.h"

#include "../controller/EmailVerificationCode.h"

#include "model/gradido/Transaction.h"

#include "Poco/Thread.h"
#include "Poco/Types.h"
#include "Poco/DateTime.h"
#include "Poco/Net/IPAddress.h"
#include "Poco/Net/HTTPCookie.h"

#include <mutex>


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

class Session : public NotificationList, public UniLib::lib::MultithreadContainer
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

	//! \brief new register function, without showing user pubkeys, using controller/user
	bool createUserDirect(const std::string& first_name, const std::string& last_name, const std::string& email, const std::string& password, const std::string &baseUrl);


	// adminRegister without passwort
	bool adminCreateUser(const std::string& first_name, const std::string& last_name, const std::string& email, int group_id, const std::string &baseUrl);

	// TODO: check if email exist and if not, fake waiting on password hashing with profiled times of real password hashing
	UserState loadUser(const std::string& email, const std::string& password);
	bool ifUserExist(const std::string& email);

	bool deleteUser();


	// ------------------------- Email Verification Code functions -------------------------------

	bool loadFromEmailVerificationCode(Poco::UInt64 emailVerificationCode);

	//! \return 1 = konto already exist
	//!        -1 = invalid code
	//!        -2 = critical error
	//!         0 = ok
	int updateEmailVerification(Poco::UInt64 emailVerificationCode);

	// called from page with same name
	//! \return 1 = reset password email already send
	//! \return 2 = reset password email already shortly before
	//! \return 0 = ok
	int sendResetPasswordEmail(Poco::AutoPtr<controller::User> user, bool passphraseMemorized, const std::string &baseUrl);
	//
	//! \return 0 = not the same
	//! \return 1 = same
	//! \return -1 = error
	//!  \return -2 = critical error
	int comparePassphraseWithSavedKeys(const std::string& inputPassphrase, const Mnemonic* wordSource);

	Poco::Net::HTTPCookie getLoginCookie();


	inline int getHandle() { return mHandleId; }

	// ------------------------ Passphrase functions ----------------------------

	inline void setPassphrase(Poco::AutoPtr<Passphrase> passphrase) { mNewPassphrase = passphrase; }
	inline Poco::AutoPtr<Passphrase> getPassphrase() { return mNewPassphrase; }

	inline void setPassphrase(const std::string& passphrase) { mPassphrase = passphrase; }

	inline const std::string& getOldPassphrase() { return mPassphrase; }

	bool generateKeys(bool savePrivkey, bool savePassphrase);

	inline void setClientIp(Poco::Net::IPAddress ip) { mClientLoginIP = ip; }
	inline Poco::Net::IPAddress getClientIp() { return mClientLoginIP; }

	inline bool isIPValid(Poco::Net::IPAddress ip) { return mClientLoginIP == ip; }
	void reset();

	void updateState(SessionStates newState);
	const char* getSessionStateString();
	inline SessionStates getSessionState() { SessionStates s; lock("Session::getSessionState"); s = mState; unlock(); return s; }

	inline Poco::UInt64 getEmailVerificationCode() {
		std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
		if (mEmailVerificationCodeObject.isNull()) return 0; return mEmailVerificationCodeObject->getModel()->getCode();
	}
	inline void setEmailVerificationCodeObject(Poco::AutoPtr<controller::EmailVerificationCode> emailVerficationObject) {
		std::unique_lock<std::shared_mutex> _lock(mSharedMutex);
		mEmailVerificationCodeObject = emailVerficationObject;
	}
	inline model::table::EmailOptInType getEmailVerificationType() {
		std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
		if (mEmailVerificationCodeObject.isNull()) {
			return model::table::EMAIL_OPT_IN_EMPTY;
		}
		return mEmailVerificationCodeObject->getModel()->getType();
	}

	//! \return -1 if session is locked
	//! \return 1 if session is active
	//! \return 0
	int isActive();
	//! \return false if session is locked
	bool setActive(bool active);

	bool isDeadLocked();

	inline Poco::DateTime getLastActivity() { return mLastActivity; }

	// ------------------------ transactions functions ----------------------------

	inline void setLastTransaction(Poco::AutoPtr<model::gradido::Transaction> lastTransaction) { lock(); mLastTransaction = lastTransaction; unlock(); }
	bool lastTransactionTheSame(Poco::AutoPtr<model::gradido::Transaction> newTransaction);

	inline LanguageCatalog* getLanguageCatalog() { return mLanguageCatalog.isNull() ? nullptr : mLanguageCatalog; }
	void setLanguage(Languages lang);
	inline void setLanguageCatalog(Poco::AutoPtr<LanguageCatalog> languageCatalog) { mLanguageCatalog = languageCatalog; }
	Languages getLanguage();
	inline const char* gettext(const char* text) { if (mLanguageCatalog.isNull()) return text; return mLanguageCatalog->gettext(text); }

	// last referer
	inline void setLastReferer(const std::string& lastReferer) { mLastExternReferer = lastReferer; }
	inline const std::string& getLastReferer() const { return mLastExternReferer; }

	inline void setCallerUri(const std::string& callerUri) { mCallerUri = callerUri; }
	inline const std::string& getCallerUri() { return mCallerUri; }

protected:
	void updateTimeout();
	inline void setHandle(int newHandle) { mHandleId = newHandle; }

	void detectSessionState();
	static const char* translateSessionStateToString(SessionStates state);

	inline const std::string& getPassphrase() const { return mPassphrase; }


private:

	int mHandleId;
	Poco::AutoPtr<controller::User> mNewUser;
	std::string mPassphrase;
	Poco::AutoPtr<Passphrase> mNewPassphrase;
	Poco::DateTime mLastActivity;
	Poco::Net::IPAddress mClientLoginIP;
	std::string          mLastExternReferer;
	//! should be used by vue-client and similar clients
	std::string			 mCallerUri;
	Poco::AutoPtr<controller::EmailVerificationCode> mEmailVerificationCodeObject;
	std::shared_mutex	 mSharedMutex;

	Poco::AutoPtr<model::gradido::Transaction> mLastTransaction;

	SessionStates mState;

	bool mActive;

	Poco::AutoPtr<LanguageCatalog> mLanguageCatalog;
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
