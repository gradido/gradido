#ifndef GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE

#include "CPUTask.h"
#include "Poco/Net/MailMessage.h"

#include "../model/Email/Email.h"

/*
 * @author: Dario Rekowski
 *
 * @date: 29.09.19
 * @desc: Task for send an email, the first parent dependence pointer must be a prepare email task
*/


class SendEmailTask : public UniLib::controller::CPUTask
{
public:

	SendEmailTask(Poco::Net::MailMessage* mailMessage, UniLib::controller::CPUSheduler* cpuScheduler, size_t additionalTaskDependenceCount = 0);
	SendEmailTask(model::Email*	email, UniLib::controller::CPUSheduler* cpuScheduler, size_t additionalTaskDependenceCount = 0);
	virtual ~SendEmailTask();

	virtual int run();

	virtual const char* getResourceType() const { return "SendEmailTask"; };
protected:

private:
	Poco::Net::MailMessage* mMailMessage;
	model::Email*			mEmail;
};


#endif //GRADIDO_LOGIN_SERVER_TASKS_SEND_EMAIL_TASK_INCLUDE