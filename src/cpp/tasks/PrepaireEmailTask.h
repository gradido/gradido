#ifndef GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE

#include "Task.h"


class PrepaireEmailTask : public UniLib::controller::Task
{
public:
	PrepaireEmailTask();
	virtual ~PrepaireEmailTask();

	virtual int run();

	virtual const char* getResourceType() const { return "PrepaireEmailTask"; };
protected:

private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_PREPAIRE_EMAIL_TASK_INCLUDE