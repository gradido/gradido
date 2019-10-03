#include "SessionManager.h"
#include "ErrorManager.h"
#include "../ServerConfig.h"

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
		case VALIDATE_HAS_NUMBER: mValidations[i] = new Poco::RegularExpression(".*[0-9].*"); break;
		case VALIDATE_HAS_SPECIAL_CHARACTER: mValidations[i] = new Poco::RegularExpression(".*[@$!%*?&+-].*"); break;
		case VALIDATE_HAS_UPPERCASE_LETTER: mValidations[i] = new Poco::RegularExpression(".*[A-Z].*"); break;
		case VALIDATE_HAS_LOWERCASE_LETTER: mValidations[i] = new Poco::RegularExpression(".*[a-z].*"); break;
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

int SessionManager::generateNewUnusedHandle()
{
	int newHandle = 0;
	int maxTrys = 0;
	do {
		newHandle = randombytes_random();
		maxTrys++;
	} while (mRequestSessionMap.find(newHandle) != mRequestSessionMap.end() && maxTrys < 100);

	if (maxTrys >= 100 || 0 == newHandle) {
		auto em = ErrorManager::getInstance();
		em->addError(new ParamError("SessionManager::generateNewUnusedHandle", "can't find new handle, have already ", std::to_string(mRequestSessionMap.size())));
		em->sendErrorsAsEmail();
		//printf("[SessionManager::%s] can't find new handle, have already: %d",
		//__FUNCTION__, mRequestSessionMap.size());
		return 0;
	}
	return newHandle;
}

Session* SessionManager::getNewSession(int* handle)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}

	// first check if we have any timeouted session to directly reuse it
	checkTimeoutSession();

	// lock 
	mWorkingMutex.lock();

	//UniLib::controller::TaskPtr checkSessionTimeout(new CheckSessionTimeouted);
	//checkSessionTimeout->scheduleTask(checkSessionTimeout);

	// check if we have an existing session ready to use 
	while (mEmptyRequestStack.size() > 0) {	
		int local_handle = mEmptyRequestStack.top();
		mEmptyRequestStack.pop();
		auto resultIt = mRequestSessionMap.find(local_handle);
		if (resultIt != mRequestSessionMap.end() && !resultIt->second->isActive()) {
			Session* result = resultIt->second;
			result->reset();
			mWorkingMutex.unlock();

			if (handle) {
				*handle = local_handle;
			}
			result->setActive(true);
			return result;
		}
	}
	
	// else create new RequestSession Object
	// calculate random handle
	// check if already exist, if get new
	int newHandle = generateNewUnusedHandle();
	if (!newHandle) {
		mWorkingMutex.unlock();
		return nullptr;
	}

	auto requestSession = new Session(newHandle);
	mRequestSessionMap.insert(std::pair<int, Session*>(newHandle, requestSession));

	requestSession->setActive(true);
	mWorkingMutex.unlock();

	if (handle) {
		*handle = newHandle;
	}
	
	return requestSession;
	

	//return nullptr;
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
	Session* session = it->second;
	session->reset();
	session->setActive(false);
	// change request handle we don't want session hijacking
	
	int newHandle = generateNewUnusedHandle();
	// erase after generating new number to prevent to getting the same number again
	mRequestSessionMap.erase(requestHandleSession);

	if (!newHandle) {
		delete session;
		mWorkingMutex.unlock();
		return true;
	}
	
	session->setHandle(newHandle);
	mRequestSessionMap.insert(std::pair<int, Session*>(newHandle, session));
	mEmptyRequestStack.push(newHandle);
	
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
		result->setActive(true);
		result->updateTimeout();
	}
	mWorkingMutex.unlock();
	return result;
}

Session* SessionManager::findByEmailVerificationCode(long long emailVerificationCode)
{
	Session* result = nullptr;
	mWorkingMutex.lock();
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		if (it->second->getEmailVerificationCode() == emailVerificationCode) {
			result = it->second;
			break;
		}
	}
	mWorkingMutex.unlock();

	return result;
}

void SessionManager::checkTimeoutSession()
{
	mWorkingMutex.lock();
	auto now = Poco::DateTime();
	// random variance within 10 seconds for timeout to make it harder to get information and hack the server
	auto timeout = Poco::Timespan(ServerConfig::g_SessionTimeout * 60, randombytes_random() % 10000000);
	std::stack<int> toRemove;
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		if (!it->second->isActive()) continue;
		Poco::Timespan timeElapsed(now - it->second->getLastActivity());
		if (timeElapsed > timeout) {
			toRemove.push(it->first);
		}
	}
	mWorkingMutex.unlock();

	while (toRemove.size() > 0) {
		int handle = toRemove.top();
		toRemove.pop();
		releseSession(handle);
	}
	
}



int CheckSessionTimeouted::run()
{
	SessionManager::getInstance()->checkTimeoutSession();
	return 0;
}