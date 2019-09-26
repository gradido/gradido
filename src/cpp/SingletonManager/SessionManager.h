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


#include "../Session/MysqlSession.h"

#include <mutex>
#include <map>
#include <stack>

class SessionManager
{
public:
	~SessionManager();

	static SessionManager* getInstance();

	MysqlSession* getNewMysqlSession(int* handle = nullptr);
	inline bool releseMysqlSession(MysqlSession* requestSession) {
		return releseMysqlSession(requestSession->getHandle());
	}
	bool releseMysqlSession(int requestHandleSession);
	bool isExist(int requestHandleSession);
	MysqlSession* getMysqlSession(int handle);

	void deinitalize();
protected:
	SessionManager();


	// access mutex
	std::mutex mWorkingMutex;
	
	// sessions storage
	std::map<int, MysqlSession*> mRequestSessionMap;
	std::stack<int>				   mEmptyRequestStack;

	bool					mInitalized;
};

#endif //DR_LUA_WEB_MODULE_SESSION_MANAGER_H