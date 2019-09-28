#include "WriteIntoDBTask.h"

WriteIntoDBTask::WriteIntoDBTask(ConnectionType type, std::vector<MysqlTable*> multipleData, UniLib::controller::CPUSheduler* cpuScheduler, size_t taskDependenceCount/* = 0*/)
	: UniLib::controller::CPUTask(cpuScheduler, taskDependenceCount),  mConnectionType(type), mDataToInsert(multipleData)
{

}

WriteIntoDBTask::~WriteIntoDBTask()
{
	for (auto it = mDataToInsert.begin(); it != mDataToInsert.end(); it++) {
		delete *it;
	}
	mDataToInsert.clear();
}

int WriteIntoDBTask::run()
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(mConnectionType);

	for (auto it = mDataToInsert.begin(); it != mDataToInsert.end(); it++) {
		auto tableName = (*it)->getTableName();
		Poco::Data::Statement insert(session);
		/*insert << "INSERT INTO Person VALUES(?, ?, ?)",
			use(person.name),
			use(person.address),
			use(person.age);*/
		insert << "INSERT INTO " << tableName << " (";
		for (int iField = 0; iField < (*it)->getFieldCount(); iField++) {
			if (iField > 0) insert << ",";
			insert << (*it)->getHeaderName(iField);
		}
		insert << ") VALUES(";
		for (int iCell = 0; iCell < (*it)->getFieldCount(); iCell++) {
			if (iCell > 0) insert << ",";
			insert << "?";
		}
		insert << ")";
		(*it)->connectToStatement(&insert);
		insert.execute();

	}

	return 0;
}