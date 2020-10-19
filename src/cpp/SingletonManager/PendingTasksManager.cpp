#include "PendingTasksManager.h"

PendingTasksManager::PendingTasksManager()
{

}

PendingTasksManager::~PendingTasksManager()
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	for (auto it = mPendingTasks.begin(); it != mPendingTasks.end(); it++) {
		delete it->second;
	}
	mPendingTasks.clear();
}

PendingTasksManager* PendingTasksManager::getInstance()
{
	static PendingTasksManager theOne;
	return &theOne;
}

int PendingTasksManager::load()
{
	auto pending_tasks = controller::PendingTask::loadAll();
	for (auto it = pending_tasks.begin(); it != pending_tasks.end(); it++) {
		addTask(*it);
	}
	return 0;
}

int PendingTasksManager::addTask(Poco::AutoPtr<controller::PendingTask> task)
{
	if (task.isNull() || !task->getModel()) {
		return -1;
	}
	auto model = task->getModel();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto pending_task_list = getTaskListForUser(model->getUserId());
	pending_task_list->push_back(task);
	return 0;

}

PendingTasksManager::PendingTaskList* PendingTasksManager::getTaskListForUser(int userId)
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingTasks.find(userId);
	if (it == mPendingTasks.end()) {
		auto pending_list = new PendingTaskList;
		mPendingTasks.insert(std::pair<int, PendingTaskList*>(userId, pending_list));
		return pending_list;
	}
	else {
		return it->second;
	}

}
const PendingTasksManager::PendingTaskList* PendingTasksManager::getTaskListForUser(int userId) const
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingTasks.find(userId);
	if (it != mPendingTasks.end()) {
		return it->second;
	}
	return nullptr;
}

bool PendingTasksManager::hasPendingTask(Poco::AutoPtr<controller::User> user, model::table::TaskType type)
{
	auto model = user->getModel();
	int user_id = model->getID();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingTasks.find(user_id);
	if (it != mPendingTasks.end()) {
		auto task_list = it->second;
		for (auto task = task_list->begin(); task != task_list->end(); it++) {
			auto task_model = (*task)->getModel();
			if (type == task_model->getTaskType()) {
				return true;
			}
		}
	}
	return false;

}

std::vector<Poco::AutoPtr<controller::PendingTask>> PendingTasksManager::getPendingTasks(Poco::AutoPtr<controller::User> user, model::table::TaskType type)
{
	auto model = user->getModel();
	int user_id = model->getID();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<controller::PendingTask>> results;

	auto it = mPendingTasks.find(user_id);
	if (it != mPendingTasks.end()) {
		auto task_list = it->second;
		results.reserve(task_list->size());
		for (auto taskIt = task_list->begin(); taskIt != task_list->end(); taskIt++) {
			auto task_model = (*taskIt)->getModel();
			if (type == task_model->getTaskType()) {
				results.push_back(*taskIt);
			}
		}
	}
	return results;
}
