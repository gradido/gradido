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

	for (auto it = mPendingGradidoTransactions.begin(); it != mPendingGradidoTransactions.end(); it++) {
		delete it->second;
	}
	mPendingGradidoTransactions.clear();
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


int PendingTasksManager::addTask(Poco::AutoPtr<model::gradido::Transaction> gradidoTransactionTask)
{
	if (gradidoTransactionTask.isNull() || !gradidoTransactionTask->getModel()) {
		return -1;
	}

	auto model = gradidoTransactionTask->getModel();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto pending_task_list = getGradidoTransactionsForUser(model->getUserId());
	pending_task_list->push_back(gradidoTransactionTask);
	return 0;
}


bool PendingTasksManager::removeTask(Poco::AutoPtr<model::gradido::Transaction> gradidoTransactionTask)
{
	if (gradidoTransactionTask.isNull() || !gradidoTransactionTask->getModel()) {
		return false;
	}
	auto model = gradidoTransactionTask->getModel();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto pending_task_list = getGradidoTransactionsForUser(model->getUserId());
	bool removed = false;
	for (auto it = pending_task_list->begin(); it != pending_task_list->end(); it++) {
		if (gradidoTransactionTask.get() == it->get()) {
			pending_task_list->erase(it);
			removed = true;
			break;
		}
	}
	// keep list for user in memory
	return removed;
}


PendingTasksManager::PendingGradidoTaskList* PendingTasksManager::getGradidoTransactionsForUser(int userId)
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingGradidoTransactions.find(userId);
	if (it == mPendingGradidoTransactions.end()) {
		auto pending_list = new PendingGradidoTaskList;
		mPendingGradidoTransactions.insert(std::pair<int, PendingGradidoTaskList*>(userId, pending_list));
		return pending_list;
	}
	else {
		return it->second;
	}
}


const PendingTasksManager::PendingGradidoTaskList* PendingTasksManager::getGradidoTransactionsForUser(int userId) const
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingGradidoTransactions.find(userId);
	if (it != mPendingGradidoTransactions.end()) {
		return it->second;
	}
	return nullptr;
}

bool PendingTasksManager::hasPendingGradidoTransaction(Poco::AutoPtr<controller::User> user, model::table::TaskType type)
{
	auto model = user->getModel();
	int user_id = model->getID();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	auto it = mPendingGradidoTransactions.find(user_id);
	if (it != mPendingGradidoTransactions.end()) {
		auto task_list = it->second;
		for (auto taskIt = task_list->begin(); taskIt != task_list->end(); taskIt++) {
			if ((*taskIt)->getModel()->getTaskType() == type) {
				return true;
			}
		}
	}
	return false;

}


std::vector<Poco::AutoPtr<model::gradido::Transaction>> PendingTasksManager::getPendingGradidoTransactions(Poco::AutoPtr<controller::User> user, model::table::TaskType type)
{
	auto model = user->getModel();
	int user_id = model->getID();
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> results;

	auto it = mPendingGradidoTransactions.find(user_id);
	if (it != mPendingGradidoTransactions.end()) {
		auto task_list = it->second;
		results.reserve(task_list->size());
		for (auto taskIt = task_list->begin(); taskIt != task_list->end(); taskIt++) {
			auto task_model = (*taskIt)->getModel();
			if (task_model->getTaskType() == type) {
				results.push_back(*taskIt);
			}
		}
	}
	return results;
}

std::vector<Poco::AutoPtr<model::gradido::Transaction>>  PendingTasksManager::getTransactionsUserMustSign(Poco::AutoPtr<controller::User> user)
{
	// TODO: don't use cast here, because can lead to errors
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> transactions_to_sign;

	for (auto map_it = mPendingGradidoTransactions.begin(); map_it != mPendingGradidoTransactions.end(); map_it++)
	{
		auto list = map_it->second;
		for (auto list_it = list->begin(); list_it != list->end(); list_it++) 
		{
			if((*list_it)->mustSign(user)) {
				transactions_to_sign.push_back(*list_it);
			}
		}
	}
	return transactions_to_sign;
}

std::vector<Poco::AutoPtr<model::gradido::Transaction>> PendingTasksManager::getTransactionSomeoneMustSign(Poco::AutoPtr<controller::User> user)
{
	// TODO: don't use cast here, because can lead to errors
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> transactions_to_sign;
<<<<<<< HEAD

	if (user->getModel()->getRole() != model::table::ROLE_ADMIN) {
		return transactions_to_sign;
	}
=======
>>>>>>> Remove dynamic cast because it lead to errors again and agin (Poco::AutoPtr don't work correct with that)

	for (auto map_it = mPendingGradidoTransactions.begin(); map_it != mPendingGradidoTransactions.end(); map_it++)
	{
		auto list = map_it->second;
		for (auto list_it = list->begin(); list_it != list->end(); list_it++)
		{
			if ((*list_it)->needSomeoneToSign(user)) {
				transactions_to_sign.push_back(*list_it);
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

		for (auto map_it = mPendingGradidoTransactions.begin(); map_it != mPendingGradidoTransactions.end(); map_it++)
		{
			auto list = map_it->second;
			for (auto list_it = list->begin(); list_it != list->end(); list_it++)
			{
				auto transaction = *list_it;
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


Poco::AutoPtr<model::gradido::Transaction> PendingTasksManager::getPendingGradidoTransaction(int pendingTaskId)
{
	Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
	for (auto map_it = mPendingGradidoTransactions.begin(); map_it != mPendingGradidoTransactions.end(); map_it++)
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

