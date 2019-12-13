#ifndef GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE

#include "CPUTask.h"
#include "Poco/Net/SecureSMTPClientSession.h"



class PrepareEmailTask : public UniLib::controller::CPUTask
{
public:
	PrepareEmailTask(UniLib::controller::CPUSheduler* cpuScheduler);
	virtual ~PrepareEmailTask();

	virtual int run();
	int send(Poco::Net::MailMessage* message);
	virtual const char* getResourceType() const { return "PrepareEmailTask"; };
protected:

private:
	Poco::Net::SecureSMTPClientSession* mMailClientSession;
};


#endif //GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE