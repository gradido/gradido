#ifndef GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE

#include "Task.h"


class SendEmailTask : public UniLib::controller::Task
{
public:
	SendEmailTask();
	~SendEmailTask();

	virtual int run();
protected:

private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE