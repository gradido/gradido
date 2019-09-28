#ifndef GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE

#include "CPUTask.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../MySQL/MysqlTable.h"

#include "Poco/Tuple.h"

class WriteIntoDBTask : public UniLib::controller::CPUTask
{
public:
	//! \param multipleData clear table in deconstruction, call delete for every entry
	WriteIntoDBTask(ConnectionType type, std::vector<MysqlTable*> multipleData, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount = 0);
	virtual ~WriteIntoDBTask();

	virtual int run();

	virtual const char* getResourceType() const { return "WriteIntoDBTask"; };

protected:

private:
	ConnectionType mConnectionType;
	std::vector<MysqlTable*> mDataToInsert;

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE