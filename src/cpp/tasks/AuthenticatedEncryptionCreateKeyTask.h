#ifndef __GRADIDO_LOGIN_SERVER_TASKS_AUTHENTICATED_ENCRYPTION_CREATE_KEY_TASK_H
#define __GRADIDO_LOGIN_SERVER_TASKS_AUTHENTICATED_ENCRYPTION_CREATE_KEY_TASK_H

#include "CPUTask.h"
#include "../controller/User.h"

class AuthenticatedEncryptionCreateKeyTask : public UniLib::controller::CPUTask
{
public:
	AuthenticatedEncryptionCreateKeyTask(Poco::AutoPtr<controller::User> user, const std::string& passwd);
	virtual ~AuthenticatedEncryptionCreateKeyTask();

	int run();
	const char* getResourceType() const { return "AuthenticatedEncryptionCreateKeyTask"; };
protected:
	Poco::AutoPtr<controller::User> mUser;
	std::string mPassword;
};

#endif //__GRADIDO_LOGIN_SERVER_TASKS_AUTHENTICATED_ENCRYPTION_CREATE_KEY_TASK_H