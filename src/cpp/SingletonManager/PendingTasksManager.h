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

#include "../controller/PendingTask.h"

class PendingTasksManager: public UniLib::lib::MultithreadContainer
{
public:
	typedef std::list<Poco::AutoPtr<controller::PendingTask>>  PendingTaskList;

	~PendingTasksManager();

	static PendingTasksManager* getInstance();

	//! \brief load pending tasks from db at server start
	int load();

	//! \return -1 task is zero
	//! \return 0 if added
	int addTask(Poco::AutoPtr<controller::PendingTask> task);

	//! by calling this, important is to call lock to prevent vanishing the list while working with it,
	//! and unlock afterwards
	//! \return list or nullptr if no list for user exist
	const PendingTaskList* getTaskListForUser(int userId) const;

protected:
	PendingTasksManager();
	
	
	std::map<int, PendingTaskList*> mPendingTasks;
	//! \return list for user, creating new list and map entry if not exist
	PendingTaskList* getTaskListForUser(int userId);
};



#endif //GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_PENDING_TASKS_MANAGER