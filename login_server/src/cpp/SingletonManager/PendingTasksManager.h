/*!
*
* \author: einhornimmond
*
* \date: 13.10.20
*
* \brief: manage tasks which need to wait on extern work

* like hedera tasks waiting on hedera network processing transactions
* like gradido transactions which are signed from additional people like ManageGroup Tasks
*/

#ifndef GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_PENDING_TASKS_MANAGER
#define GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_PENDING_TASKS_MANAGER

#include "controller/PendingTask.h"
#include "model/gradido/Transaction.h"
#include "controller/User.h"
#include "model/gradido/Transaction.h"

class UserUpdateGroupPage;

class PendingTasksManager: protected UniLib::lib::MultithreadContainer
{
	friend UserUpdateGroupPage;
public:
	typedef std::list<Poco::AutoPtr<controller::PendingTask>>  PendingTaskList;
	typedef std::list<Poco::AutoPtr<model::gradido::Transaction>> PendingGradidoTaskList;

	~PendingTasksManager();

	static PendingTasksManager* getInstance();

	//! \brief load pending tasks from db at server start
	int load();

	//! \return -1 task is zero
	//! \return 0 if added
	int addTask(Poco::AutoPtr<model::gradido::Transaction> gradidoTransactionTask);

	bool removeTask(Poco::AutoPtr<model::gradido::Transaction> gradidoTransactionTask);

	//! check if tasks can be removed
	void checkForFinishedTasks(Poco::Timer& timer);

	//! by calling this, important is to call lock to prevent vanishing the list while working with it,
	//! and unlock afterwards
	//! \return list or nullptr if no list for user exist
	const PendingGradidoTaskList* getGradidoTransactionsForUser(int userId) const;
	bool hasPendingGradidoTransaction(Poco::AutoPtr<controller::User> user, model::table::TaskType type);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> getPendingGradidoTransactions(Poco::AutoPtr<controller::User> user, model::table::TaskType type);
	Poco::AutoPtr<model::gradido::Transaction> getPendingGradidoTransaction(int pendingTaskId);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> getTransactionsUserMustSign(Poco::AutoPtr<controller::User> user);
	std::vector<Poco::AutoPtr<model::gradido::Transaction>> getTransactionSomeoneMustSign(Poco::AutoPtr<controller::User> user);


protected:
	PendingTasksManager();

	Poco::Timer mCheckForFinishedTimer;
	
	
	std::map<int, PendingTaskList*> mPendingTasks;
	std::map<int, PendingGradidoTaskList*> mPendingGradidoTransactions;
	//! \return list for user, creating new list and map entry if not exist
	PendingTaskList* getTaskListForUser(int userId);
	PendingGradidoTaskList* getGradidoTransactionsForUser(int userId);
};



#endif //GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_PENDING_TASKS_MANAGER