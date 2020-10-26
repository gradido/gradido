#include "PendingTask.h"

#include "../tasks/GradidoGroupAddMemberTask.h"
#include "../model/gradido/Transaction.h"
#include "../SingletonManager/PendingTasksManager.h"

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
		//auto pending_task = new PendingTask(db);
		auto pending_task = loadCorrectDerivedClass(db);
		return Poco::AutoPtr<PendingTask>(pending_task);
	}

	std::vector<Poco::AutoPtr<PendingTask>> PendingTask::load(int userId)
	{
		auto db = new model::table::PendingTask();
		auto pending_task_list = db->loadFromDB<int, model::table::PendingTaskTuple>("user_id", userId, 3);
		std::vector<Poco::AutoPtr<PendingTask>> resultVector;
		resultVector.reserve(pending_task_list.size());
		for (auto it = pending_task_list.begin(); it != pending_task_list.end(); it++) {
			//resultVector.push_back(new PendingTask(new model::table::PendingTask(*it)));
			resultVector.push_back(loadCorrectDerivedClass(new model::table::PendingTask(*it)));
		}
		return resultVector;
		

	}

	/*Poco::AutoPtr<PendingTask> PendingTask::loadCorrectDerivedClass(model::table::PendingTask* dbModel)
	{
		if (dbModel->isGradidoTransaction()) {
			return model::gradido::Transaction::load(dbModel);
		}
	}*/
	Poco::AutoPtr<PendingTask> PendingTask::loadCorrectDerivedClass(model::table::PendingTask* dbModel)
	{
		if (!dbModel) return nullptr;
		auto type = dbModel->getTaskType();
		switch (type) {
		case model::table::TASK_TYPE_GROUP_ADD_MEMBER: return new GradidoGroupAddMemberTask(dbModel);
		default: return nullptr;
		}
		return nullptr;
	}

	std::vector<Poco::AutoPtr<PendingTask>> PendingTask::loadAll()
	{
		auto db = new model::table::PendingTask();
		std::vector<model::table::PendingTaskTuple> task_list;
		// throw an unresolved external symbol error
		task_list = db->loadAllFromDB<model::table::PendingTaskTuple>();

		
		//*/ //work around end
		std::vector<Poco::AutoPtr<PendingTask>> resultVector;

		resultVector.reserve(task_list.size());
		for (auto it = task_list.begin(); it != task_list.end(); it++) {
			auto group_ptr = loadCorrectDerivedClass(new model::table::PendingTask(*it));
			resultVector.push_back(group_ptr);
		}
		return resultVector;
	}

	bool PendingTask::deleteFromDB()
	{
		auto result = mDBModel->deleteFromDB(); 
		if (result) {

			PendingTasksManager::getInstance()->removeTask(Poco::AutoPtr<PendingTask>(this, true));
		}
		return result;
	}

	Poco::AutoPtr<controller::User> PendingTask::getUser()
	{
		if (!mUser.isNull()) {
			return mUser;
		}
		auto user_id = getModel()->getUserId();
		if (!user_id) {
			return nullptr;
		}
		mUser = controller::User::create();
		mUser->load(user_id);
		return mUser;

	}
}