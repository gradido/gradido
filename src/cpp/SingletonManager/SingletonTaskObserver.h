/*!
*
* \author: einhornimmond
*
* \date: 10.01.20
*
* \brief: observe tasks, for example passwort creation or transactions
*/

#ifndef DR_GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_SINGLETON_TASK_OBSERVER_H
#define DR_GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_SINGLETON_TASK_OBSERVER_H

#include "Poco/Mutex.h"
#include "../lib/DRHashList.h"
#include "../lib/MultithreadContainer.h"

#include <vector>

enum TaskObserverType {
	TASK_OBSERVER_PASSWORD_CREATION,
	TASK_OBSERVER_SIGN_TRANSACTION,
	TASK_OBSERVER_PREPARE_TRANSACTION,
	TASK_OBSERVER_READY_FOR_SIGN_TRANSACTION,
	TASK_OBSERVER_COUNT,
	TASK_OBSERVER_INVALID
};

class SingletonTaskObserver : public UniLib::lib::MultithreadContainer
{
public:
	~SingletonTaskObserver();

	static SingletonTaskObserver* getInstance();
	
	void addTask(DHASH id, TaskObserverType type);
	void addTask(const std::string& email, TaskObserverType type);
	void removeTask(DHASH id, TaskObserverType type);
	void removeTask(const std::string& email, TaskObserverType type);


	//! \return true if found and deleted
	//! \return false if not found
	bool removeTasksCount(const std::string& email);

	//! \return -1 if no entry for email found
	int getTaskCount(const std::string& email, TaskObserverType type);
	std::vector<int> getTasksCount(const std::string& email);

	static const char* TaskObserverTypeToString(TaskObserverType type);
	static TaskObserverType StringToTaskObserverType(const std::string& typeString);

	static inline DHASH makeHash(const std::string& email) { return DRMakeStringHash(email.data(), email.size()); }

protected:
	SingletonTaskObserver();


	struct UserObserverEntry
	{
		UserObserverEntry(const std::string& email, DHASH id);

		std::string mEmail;
		DHASH		mHash;
		int         mTasksCount[TASK_OBSERVER_COUNT];
	};

	DRHashList  mObserverEntrys;

};

#endif //DR_GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_SINGLETON_TASK_OBSERVER_H