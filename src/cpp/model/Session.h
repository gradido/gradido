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

#include "../Error/ErrorList.h"

class Session : public ErrorList
{
public:
	Session(int handle);
	~Session();

	inline int getHandle() { return mHandleId; }
	virtual void reset() = 0;

protected:
	int mHandleId;

};

#endif // DR_LUA_WEB_MODULE_SESSION_SESSION_H
