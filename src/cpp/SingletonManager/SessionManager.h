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
	Session* getSession(int handle);
	Session* findByEmailVerificationCode(long long emailVerificationCode);

	bool init();
	void deinitalize();

	bool isValid(const std::string& subject, SessionValidationTypes validationType);

protected:
	SessionManager();


	// access mutex
	std::mutex mWorkingMutex;
	
	// sessions storage
	std::map<int, Session*> mRequestSessionMap;
	std::stack<int>			mEmptyRequestStack;

	bool					mInitalized;

	// validations
	Poco::RegularExpression*  mValidations[VALIDATE_MAX];
};

#endif //DR_LUA_WEB_MODULE_SESSION_MANAGER_H