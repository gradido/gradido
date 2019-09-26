#include "SessionManager.h"

SessionManager* SessionManager::getInstance()
{
	static SessionManager only;
	return &only;
}

SessionManager::SessionManager()
	: mInitalized(true)
{

}

SessionManager::~SessionManager()
{
	if (mInitalized) {
		deinitalize();
	}
}

void SessionManager::deinitalize()
{
	
	mWorkingMutex.lock();

	while (mEmptyRequestStack.size()) {
		mEmptyRequestStack.pop();
	}

	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		delete it->second;
	}
	mRequestSessionMap.clear();
	
	mInitalized = false;
	mWorkingMutex.unlock();
}


MysqlSession* SessionManager::getNewMysqlSession(int* handle)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}
	// lock 
	mWorkingMutex.lock();

	// check if we have an existing session ready to use 
	if (mEmptyRequestStack.size() > 0) {	
		int local_handle = mEmptyRequestStack.top();
		mEmptyRequestStack.pop();
		auto resultIt = mRequestSessionMap.find(local_handle);
		if (resultIt != mRequestSessionMap.end()) {
			MysqlSession* result = resultIt->second;
			mWorkingMutex.unlock();

			if (handle) {
				*handle = local_handle;
			}
			return result;
		}
	}
	else {
		// else create new RequestSession Object
		int newHandle = mRequestSessionMap.size();
		auto requestSession = new MysqlSession(newHandle);
		mRequestSessionMap.insert(std::pair<int, MysqlSession*>(newHandle, requestSession));
		mWorkingMutex.unlock();

		if (handle) {
			*handle = newHandle;
		}

		return requestSession;
	}

	return nullptr;
}

bool SessionManager::releseMysqlSession(int requestHandleSession)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}
	mWorkingMutex.lock();
	auto it = mRequestSessionMap.find(requestHandleSession);
	if (it == mRequestSessionMap.end()) {
		printf("[SessionManager::releaseRequestSession] requestSession with handle: %d not found\n", requestHandleSession);
		mWorkingMutex.unlock();
		return false;
	}
	it->second->reset();
	mEmptyRequestStack.push(requestHandleSession);
	mWorkingMutex.unlock();

	return true;
}

bool SessionManager::isExist(int requestHandleSession)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}
	bool result = false;
	mWorkingMutex.lock();
	auto it = mRequestSessionMap.find(requestHandleSession);
	if (it != mRequestSessionMap.end()) {
		result = true;
	}
	mWorkingMutex.unlock();
	return result;
}

MysqlSession* SessionManager::getMysqlSession(int handle)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}
	MysqlSession* result = nullptr;
	mWorkingMutex.lock();
	auto it = mRequestSessionMap.find(handle);
	if (it != mRequestSessionMap.end()) {
		result = it->second;
	}
	mWorkingMutex.unlock();
	return result;
}