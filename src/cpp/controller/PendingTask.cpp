#include "PendingTask.h"

namespace controller {

	PendingTask::PendingTask(model::table::PendingTask* dbModel)
	{
		mDBModel = dbModel;
	}

	PendingTask::~PendingTask()
	{

	}

	Poco::AutoPtr<PendingTask> PendingTask::create(int userId, std::string serializedProtoRequest, model::table::TaskType type)
	{
		auto db = new model::table::PendingTask(userId, serializedProtoRequest, type);
		auto pending_task = new PendingTask(db);
		return Poco::AutoPtr<PendingTask>(pending_task);
	}

	std::vector<Poco::AutoPtr<PendingTask>> PendingTask::load(int userId)
	{
		auto db = new model::table::PendingTask();
		auto pending_task_list = db->loadFromDB<int, model::table::PendingTaskTuple>("user_id", userId, 3);
		std::vector<Poco::AutoPtr<PendingTask>> resultVector;
		resultVector.reserve(pending_task_list.size());
		for (auto it = pending_task_list.begin(); it != pending_task_list.end(); it++) {
			resultVector.push_back(new PendingTask(new model::table::PendingTask(*it)));
		}
		return resultVector;
		

	}

}