#ifndef GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE

#include "Task.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../MySQL/MysqlTable.h"

#include "Poco/Tuple.h"

class WriteIntoDBTask : public UniLib::controller::Task
{
public:
	//! \param multipleData clear table in deconstruction, call delete for every entry
	WriteIntoDBTask(ConnectionType type, std::vector<MysqlTable*> multipleData);
	virtual ~WriteIntoDBTask();

	virtual int run();

	virtual const char* getResourceType() const { return "WriteIntoDBTask"; };
	virtual bool isTaskFinished() { return true; }
protected:

private:
	bool mFinished;
	ConnectionType mConnectionType;
	std::vector<MysqlTable*> mDataToInsert;
};


#endif //GRADIDO_LOGIN_SERVER_TASKS_WRITE_INTO_DB_TASK_INCLUDE