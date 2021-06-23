/*!
*
* \author: einhornimmond
*
* \date: 28.02.19
*
* \brief: manage different session from lua 
*/

#ifndef DR_LUA_WEB_MODULE_SESSION_MANAGER_H
#define DR_LUA_WEB_MODULE_SESSION_MANAGER_H


#include "../model/Session.h"

#include "Poco/RegularExpression.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Mutex.h"

#include <mutex>
#include <map>
#include <stack>

enum SessionValidationTypes {
	VALIDATE_NAME,
	VALIDATE_USERNAME,
	VALIDATE_EMAIL,
	VALIDATE_PASSWORD,
	VALIDATE_PASSPHRASE,
	VALIDATE_GROUP_ALIAS,
	VALIDATE_HEDERA_ID,
	VALIDATE_HAS_NUMBER,
	VALIDATE_ONLY_INTEGER,
	VALIDATE_ONLY_DECIMAL,
	VALIDATE_ONLY_HEX,
	VALIDATE_ONLY_URL,
	VALIDATE_HAS_SPECIAL_CHARACTER,
	VALIDATE_HAS_UPPERCASE_LETTER,
	VALIDATE_HAS_LOWERCASE_LETTER,
	VALIDATE_MAX
};


// TODO: cleanup timeouted sessions
// TODO: only one session per user allowed, delete active session by new login?
class SessionManager
{
public:
	~SessionManager();

	static SessionManager* getInstance();

	

	Session* getNewSession(int* handle = nullptr);
	inline bool releaseSession(Session* requestSession) {
		if (!requestSession) return false;
		return releaseSession(requestSession->getHandle());
	}
	bool releaseSession(int requestHandleSession);
	bool isExist(int requestHandleSession);
	// try to find existing session, return nullptr if not found
	Session* getSession(int handle);
	Session* getSession(const Poco::Net::HTTPServerRequest& request);
	Session* findByEmailVerificationCode(const Poco::UInt64& emailVerificationCode);
	Session* findByEmail(const std::string& email);
	Session* findByUserId(int userId);
	std::vector<Session*> findAllByUserId(int userId);

	bool init();
	void deinitalize();

	bool isValid(const std::string& subject, SessionValidationTypes validationType);
	//! \return true if password is valid
	bool checkPwdValidation(const std::string& pwd, NotificationList* errorReciver, Poco::AutoPtr<LanguageCatalog> lang);

	void checkTimeoutSession();

	// delete all current active login cookies
	static void deleteLoginCookies(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response, Session* activeSession = nullptr);

protected:
	SessionManager();

	int generateNewUnusedHandle();

	// access mutex
	Poco::Mutex mWorkingMutex;
	
	// sessions storage
	std::map<int, Session*> mRequestSessionMap;
	std::stack<int>			mEmptyRequestStack;
	int						mDeadLockedSessionCount;

	bool					mInitalized;

	// validations
	Poco::RegularExpression*  mValidations[VALIDATE_MAX];
};


class CheckSessionTimeouted : public UniLib::controller::CPUTask
{
public:
	virtual int run();
	virtual const char* getResourceType() const { return "CheckSessionTimeouted"; }
};

#endif //DR_LUA_WEB_MODULE_SESSION_MANAGER_H