#include "PendingTasksManager.h"
#include "../lib/JsonRequest.h"
#include "ErrorManager.h"


PendingTasksManager::PendingTasksManager()
	: mCheckForFinishedTimer(2000, 2000)
{
	//mCheckForFinishedTimer
}

PendingTasksManager::~PendingTasksManager()
{
	
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	mCheckForFinishedTimer.stop();

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
	// they add them self to Pending Task Manager
	auto pending_tasks = controller::PendingTask::loadAll();
	Poco::TimerCallback<PendingTasksManager> callback(*this, &PendingTasksManager::checkForFinishedTasks);
	mCheckForFinishedTimer.start(callback);

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

bool PendingTasksManager::removeTask(Poco::AutoPtr<controller::PendingTask> task)
{
	if (task.isNull() || !task->getModel()) {
		return false;
	}
	auto model = task->getModel();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto pending_task_list = getTaskListForUser(model->getUserId());
	bool removed = false;
	for (auto it = pending_task_list->begin(); it != pending_task_list->end(); it++) {
		if (task.get() == it->get()) {
			pending_task_list->erase(it);
			removed = true;
			break;
		}
	}
	// keep list for user in memory
	return removed;
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

std::vector<Poco::AutoPtr<controller::PendingTask>>  PendingTasksManager::getTransactionsUserMustSign(Poco::AutoPtr<controller::User> user)
{
	// TODO: don't use cast here, because can lead to errors
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<controller::PendingTask>> transactions_to_sign;

	for (auto map_it = mPendingTasks.begin(); map_it != mPendingTasks.end(); map_it++) 
	{
		auto list = map_it->second;
		for (auto list_it = list->begin(); list_it != list->end(); list_it++) 
		{
			if ((*list_it)->getModel()->isGradidoTransaction()) {
				auto transaction = dynamic_cast<model::gradido::Transaction*>(list_it->get());
				if (transaction->mustSign(user)) {
					transactions_to_sign.push_back(*list_it);
				}
			}
		}
	}
	return transactions_to_sign;
}

std::vector<Poco::AutoPtr<controller::PendingTask>> PendingTasksManager::getTransactionSomeoneMustSign(Poco::AutoPtr<controller::User> user)
{
	// TODO: don't use cast here, because can lead to errors
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<controller::PendingTask>> transactions_to_sign;

	for (auto map_it = mPendingTasks.begin(); map_it != mPendingTasks.end(); map_it++)
	{
		auto list = map_it->second;
		for (auto list_it = list->begin(); list_it != list->end(); list_it++)
		{
			if ((*list_it)->getModel()->isGradidoTransaction()) {
				auto transaction = dynamic_cast<model::gradido::Transaction*>(list_it->get());
				if (transaction->needSomeoneToSign(user)) {
					transactions_to_sign.push_back(*list_it);
				}
			}
		}
	}
	return transactions_to_sign;
}

void PendingTasksManager::checkForFinishedTasks(Poco::Timer& timer)
{
	static const char* function_name = "PendingTasksManager::checkForFinishedTasks";
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	try {

		for (auto map_it = mPendingTasks.begin(); map_it != mPendingTasks.end(); map_it++)
		{
			auto list = map_it->second;
			for (auto list_it = list->begin(); list_it != list->end(); list_it++)
			{
				if ((*list_it)->getModel()->isGradidoTransaction()) {
					auto transaction = dynamic_cast<model::gradido::Transaction*>(list_it->get());
					auto json = transaction->getModel()->getResultJson();
					bool removeIt = false;
					if (!json.isNull()) {
						auto state = json->get("state");
						if (!state.isEmpty() && state.toString() == "success") {
							removeIt = true;
						}
					}
					if (removeIt) {
						transaction->deleteFromDB();
						list_it = list->erase(list_it);
						if (!list->size() || list_it == list->end()) break;
					}
				}
			}
		}
	}
	catch (Poco::Exception& ex) {
		NotificationList errors;
		errors.addError(new ParamError(function_name, "poco exception", ex.displayText()));
		errors.sendErrorsAsEmail();
	} catch(std::exception& ex) {
		NotificationList errors;
		errors.addError(new ParamError(function_name, "std::exception", ex.what()));
		errors.sendErrorsAsEmail();
	}
}

Poco::AutoPtr<controller::PendingTask> PendingTasksManager::getPendingTask(int pendingTaskId)
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	for (auto map_it = mPendingTasks.begin(); map_it != mPendingTasks.end(); map_it++)
	{
		auto list = map_it->second;
		for (auto list_it = list->begin(); list_it != list->end(); list_it++)
		{
			if ((*list_it)->getModel()->getID() == pendingTaskId) {
				return *list_it;
			}
		}
	}
	return nullptr;
}

