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

class Session : public ErrorList
{
public:
	Session(int handle);
	~Session();

	bool createUser(const std::string& name, const std::string& email, const std::string& password, const std::string& passphrase);
	bool loadUser(const std::string& email, const std::string& password);

	inline int getHandle() { return mHandleId; }
	void reset();

protected:
	int mHandleId;
	User* mSessionUser;

};

#endif // DR_LUA_WEB_MODULE_SESSION_SESSION_H
