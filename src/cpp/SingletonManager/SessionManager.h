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


#include "../Model/Session.h"

#include "Poco/RegularExpression.h"

#include <mutex>
#include <map>
#include <stack>

enum SessionValidationTypes {
	VALIDATE_NAME,
	VALIDATE_EMAIL,
	VALIDATE_PASSWORD,
	VALIDATE_PASSPHRASE,
	VALIDATE_HAS_NUMBER,
	VALIDATE_HAS_SPECIAL_CHARACTER,
	VALIDATE_HAS_UPPERCASE_LETTER,
	VALIDATE_HAS_LOWERCASE_LETTER,
	VALIDATE_MAX
};


// TODO: cleanup timeouted sessions
class SessionManager
{
public:
	~SessionManager();

	static SessionManager* getInstance();

	Session* getNewSession(int* handle = nullptr);
	inline bool releseSession(Session* requestSession) {
		return releseSession(requestSession->getHandle());
	}
	bool releseSession(int requestHandleSession);
	bool isExist(int requestHandleSession);
	// try to find existing session, return nullptr if not found
	Session* getSession(int handle);
	Session* findByEmailVerificationCode(long long emailVerificationCode);

	bool init();
	void deinitalize();

	bool isValid(const std::string& subject, SessionValidationTypes validationType);

	void checkTimeoutSession();

protected:
	SessionManager();

	int generateNewUnusedHandle();

	// access mutex
	std::mutex mWorkingMutex;
	
	// sessions storage
	std::map<int, Session*> mRequestSessionMap;
	std::stack<int>			mEmptyRequestStack;

	bool					mInitalized;

	// validations
	Poco::RegularExpression*  mValidations[VALIDATE_MAX];
};

class CheckSessionTimeouted : public UniLib::controller::CPUTask
{
public:
	virtual int run();
	virtual const char* getResourceType() const { return "CheckSessionTimeouted"; };
};

#endif //DR_LUA_WEB_MODULE_SESSION_MANAGER_H