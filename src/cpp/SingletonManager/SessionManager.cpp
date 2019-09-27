#include "SessionManager.h"

#include <sodium.h>


SessionManager* SessionManager::getInstance()
{
	static SessionManager only;
	return &only;
}

SessionManager::SessionManager()
	: mInitalized(false)
{

}

SessionManager::~SessionManager()
{
	if (mInitalized) {
		deinitalize();
	}
}


bool SessionManager::init()
{
	mWorkingMutex.lock();
	for (int i = 0; i < VALIDATE_MAX; i++) {
		switch (i) {
		//case VALIDATE_NAME: mValidations[i] = new Poco::RegularExpression("/^[a-zA-Z_ -]{3,}$/"); break;
		case VALIDATE_NAME: mValidations[i] = new Poco::RegularExpression("^[a-zA-Z]{3,}$"); break;
		case VALIDATE_EMAIL: mValidations[i] = new Poco::RegularExpression("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$"); break;
		case VALIDATE_PASSWORD: mValidations[i] = new Poco::RegularExpression("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&+-])[A-Za-z0-9@$!%*?&+-]{8,}$"); break;
		case VALIDATE_PASSPHRASE: mValidations[i] = new Poco::RegularExpression("^(?:[a-z]* ){23}[a-z]*\s*$"); break;
		default: printf("[SessionManager::%s] unknown validation type\n", __FUNCTION__);
		}
	}

	mInitalized = true; 
	mWorkingMutex.unlock();
	return true;
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

	for (int i = 0; i < VALIDATE_MAX; i++) {
		delete mValidations[i];
	}

	
	mInitalized = false;
	mWorkingMutex.unlock();
}

bool SessionManager::isValid(const std::string& subject, SessionValidationTypes validationType)
{
	if (validationType >= VALIDATE_MAX) {
		return false;
	}
	return *mValidations[validationType] == subject;
}


Session* SessionManager::getNewSession(int* handle)
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
			Session* result = resultIt->second;
			result->reset();
			mWorkingMutex.unlock();

			if (handle) {
				*handle = local_handle;
			}
			return result;
		}
	}
	else {
		// else create new RequestSession Object
		// calculate random handle
		// check if already exist, if get new
		int newHandle = 0;
		int maxTrys = 0;
		do {
			newHandle = randombytes_random();
			maxTrys++;
		} while (mRequestSessionMap.find(newHandle) != mRequestSessionMap.end() && maxTrys < 100);

		if (maxTrys >= 100 || 0 == newHandle) {
			printf("[SessionManager::%s] can't find new handle, have already: %d",
				__FUNCTION__, mRequestSessionMap.size());
			return nullptr;
		}

		auto requestSession = new Session(newHandle);
		mRequestSessionMap.insert(std::pair<int, Session*>(newHandle, requestSession));
		mWorkingMutex.unlock();

		if (handle) {
			*handle = newHandle;
		}

		return requestSession;
	}

	return nullptr;
}

bool SessionManager::releseSession(int requestHandleSession)
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

Session* SessionManager::getSession(int handle)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}
	Session* result = nullptr;
	mWorkingMutex.lock();
	auto it = mRequestSessionMap.find(handle);
	if (it != mRequestSessionMap.end()) {
		result = it->second;
	}
	mWorkingMutex.unlock();
	return result;
}