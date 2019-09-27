#ifndef GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE

#include "Task.h"
#include "../SingletonManager/ConnectionManager.h"

#include "Poco/Tuple.h"

class WriteIntoDBTask : public UniLib::controller::Task
{
public:
	WriteIntoDBTask(ConnectionType type, std::vector<);
	virtual ~WriteIntoDBTask();

	virtual int run();

	virtual const char* getResourceType() const { return "WriteIntoDBTask"; };
protected:

private:
	ConnectionType mConnectionType;

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE