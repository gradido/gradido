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

#include "Poco/Thread.h"
#include "Poco/DateTime.h"
#include "Poco/Net/IPAddress.h"

#define EMAIL_VERIFICATION_CODE_SIZE 8

class Session : public ErrorList
{
public:
	Session(int handle);
	~Session();

	bool createUser(const std::string& name, const std::string& email, const std::string& password);
	bool loadUser(const std::string& email, const std::string& password);

	inline User* getUser() { return mSessionUser; }

	inline int getHandle() { return mHandleId; }
	inline const char* getPassphrase() { return mPassphrase.data(); }

	inline void setClientIp(Poco::Net::IPAddress ip) { mClientLoginIP = ip; }
	 
	inline bool isIPValid(Poco::Net::IPAddress ip) { return mClientLoginIP == ip; }
	void reset();


protected:
	void updateTimeout();

	int createEmailVerificationCode();

	int mHandleId;
	User* mSessionUser;
	std::string mPassphrase;
	Poco::DateTime mLastActivity;
	Poco::Net::IPAddress mClientLoginIP;
	unsigned char* mEmailVerification[EMAIL_VERIFICATION_CODE_SIZE];
};

#endif // DR_LUA_WEB_MODULE_SESSION_SESSION_H
