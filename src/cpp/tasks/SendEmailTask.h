#ifndef GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE

#include "Task.h"


class SendEmailTask : public UniLib::controller::Task
{
public:
	SendEmailTask();
	virtual ~SendEmailTask();

	virtual int run();

	virtual const char* getResourceType() const { return "SendEmailTask"; };
protected:

private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE