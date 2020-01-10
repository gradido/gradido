#include "SingletonTaskObserver.h"
#include "ErrorManager.h"

SingletonTaskObserver::SingletonTaskObserver()
{

}

SingletonTaskObserver::~SingletonTaskObserver()
{

}

SingletonTaskObserver* SingletonTaskObserver::getInstance()
{
	static SingletonTaskObserver one;
	return &one;
}

void SingletonTaskObserver::addTask(const std::string& email, TaskObserverType type)
{
	DHASH id = makeHash(email);
	static const char* funcName = "SingletonTaskObserver::addTask_email";
	auto em = ErrorManager::getInstance();

	lock(funcName);
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (!entry) {
		entry = new UserObserverEntry(email, id);
		mObserverEntrys.addByHash(id, entry);
	}
	if (entry->mEmail != email) {
		em->addError(new ParamError(funcName, "hash collision with ", email.data()));
		em->addError(new ParamError(funcName, "and ", entry->mEmail.data()));
		em->sendErrorsAsEmail();
	}
	entry->mTasksCount[type]++;
	unlock();
}

void SingletonTaskObserver::addTask(DHASH id, TaskObserverType type)
{
	static const char* funcName = "SingletonTaskObserver::addTask_id";
	auto em = ErrorManager::getInstance();

	lock(funcName);
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (!entry) {
		entry = new UserObserverEntry("", id);
		mObserverEntrys.addByHash(id, entry);
	}
	entry->mTasksCount[type]++;
	unlock();
}

void SingletonTaskObserver::removeTask(const std::string& email, TaskObserverType type)
{
	DHASH id = makeHash(email);
	static const char* funcName = "SingletonTaskObserver::removeTask_email";
	auto em = ErrorManager::getInstance();

	lock(funcName);
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (entry) {
		if (entry->mTasksCount[type] > 0) {
			entry->mTasksCount[type]--;
		}
		else {		
			em->addError(new ParamError(funcName, "error more calls of removeTasks as addTasks", type));
			em->sendErrorsAsEmail();
		}
		bool oneIsNotZero = false;
		for (int i = 0; i < TASK_OBSERVER_COUNT; i++) {
			if (entry->mTasksCount[type] != 0) {
				oneIsNotZero = true;
				continue;
			}
		}
		if (!oneIsNotZero) {
			mObserverEntrys.removeByHash(id);
			delete entry;
		}
	}
	else {
		em->addError(new Error(funcName, "entry not found"));
		em->sendErrorsAsEmail();
	}
	unlock();
}


void SingletonTaskObserver::removeTask(DHASH id, TaskObserverType type)
{	
	static const char* funcName = "SingletonTaskObserver::removeTask_id";
	auto em = ErrorManager::getInstance();

	lock(funcName);
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (entry) {
		if (entry->mTasksCount[type] > 0) {
			entry->mTasksCount[type]--;
		}
		else {
			em->addError(new ParamError(funcName, "error more calls of removeTasks as addTasks", type));
			em->sendErrorsAsEmail();
		}
		bool oneIsNotZero = false;
		for (int i = 0; i < TASK_OBSERVER_COUNT; i++) {
			if (entry->mTasksCount[type] != 0) {
				oneIsNotZero = true;
				continue;
			}
		}
		if (!oneIsNotZero) {
			mObserverEntrys.removeByHash(id);
			delete entry;
		}
	}
	else {
		em->addError(new Error(funcName, "entry not found"));
		em->sendErrorsAsEmail();
	}
	unlock();
}


bool SingletonTaskObserver::removeTasksCount(const std::string& email)
{
	DHASH id = makeHash(email);
	static const char* funcName = "SingletonTaskObserver::removeTasksCount";
	auto em = ErrorManager::getInstance();

	lock(funcName);
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (entry) {
		mObserverEntrys.removeByHash(id);
		unlock();
		delete entry;
		return true;
	}
	else {
		unlock();
		return false;
	}
}

int SingletonTaskObserver::getTaskCount(const std::string& email, TaskObserverType type)
{
	DHASH id = makeHash(email);

	lock("SingletonTaskObserver::getTaskCount");
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	if (!entry || entry->mEmail != email) {
		unlock();
		return -1;
	}

	int count = entry->mTasksCount[type];
	unlock();
	return count;
}

std::vector<int> SingletonTaskObserver::getTasksCount(const std::string& email)
{
	DHASH id = makeHash(email);

	lock("SingletonTaskObserver::getTasksCount");
	UserObserverEntry* entry = static_cast<UserObserverEntry*>(mObserverEntrys.findByHash(id));
	std::vector<int> taskCounts;
	
	if (!entry || entry->mEmail != email) {
		unlock();
		return taskCounts;
	}
	taskCounts.reserve(TASK_OBSERVER_COUNT);
	for (int i = 0; i < TASK_OBSERVER_COUNT; i++) {
		taskCounts.push_back(entry->mTasksCount[i]);
	}
	unlock();
	return taskCounts;
}

const char* SingletonTaskObserver::TaskObserverTypeToString(TaskObserverType type)
{
	switch (type) {
	case TASK_OBSERVER_PASSWORD_CREATION: return "password creation";
	case TASK_OBSERVER_SIGN_TRANSACTION: return "sign transaction";
	case TASK_OBSERVER_PREPARE_TRANSACTION: return "prepare transaction";
	case TASK_OBSERVER_READY_FOR_SIGN_TRANSACTION: return "ready for sign transaction";
	case TASK_OBSERVER_COUNT: return "COUNT";
	case TASK_OBSERVER_INVALID: return "INVALID";
	default: return "UNKNOWN";
	}
}

TaskObserverType SingletonTaskObserver::StringToTaskObserverType(const std::string& typeString)
{
	if ("password creation" == typeString) {
		return TASK_OBSERVER_PASSWORD_CREATION;
	}
	else if ("sign transaction" == typeString) {
		return TASK_OBSERVER_SIGN_TRANSACTION;
	}
	else if ("prepare transaction" == typeString) {
		return TASK_OBSERVER_PREPARE_TRANSACTION;
	}
	else if ("ready for sign transaction" == typeString) {
		return TASK_OBSERVER_READY_FOR_SIGN_TRANSACTION;
	}
	return TASK_OBSERVER_INVALID;
}