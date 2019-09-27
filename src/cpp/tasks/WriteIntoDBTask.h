#ifndef GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE

#include "Task.h"


class WriteIntoDBTask : public UniLib::controller::Task
{
public:
	WriteIntoDBTask();
	~WriteIntoDBTask();

	virtual int run();
protected:

private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE