#include "SessionManager.h"
#include "ErrorManager.h"
#include "../ServerConfig.h"
#include "../Crypto/DRRandom.h"
#include "../controller/EmailVerificationCode.h"

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
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::init] exception timout mutex: %s\n", ex.displayText().data());
		return false;
	}
	//mWorkingMutex.lock();
	int i;
	DISASM_MISALIGN;
	for (i = 0; i < VALIDATE_MAX; i++) {
		switch (i) {
		//case VALIDATE_NAME: mValidations[i] = new Poco::RegularExpression("/^[a-zA-Z_ -]{3,}$/"); break;
		case VALIDATE_NAME: mValidations[i] = new Poco::RegularExpression("^[^<>&;]{3,}$"); break;
		case VALIDATE_EMAIL: mValidations[i] = new Poco::RegularExpression("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$"); break;
		case VALIDATE_PASSWORD: mValidations[i] = new Poco::RegularExpression("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&+-_])[A-Za-z0-9@$!%*?&+-_]{8,}$"); break;
		case VALIDATE_PASSPHRASE: mValidations[i] = new Poco::RegularExpression("^(?:[a-z]* ){23}[a-z]*\s*$"); break;
		case VALIDATE_HAS_NUMBER: mValidations[i] = new Poco::RegularExpression(".*[0-9].*"); break;
		case VALIDATE_HAS_SPECIAL_CHARACTER: mValidations[i] = new Poco::RegularExpression(".*[@$!%*?&+-].*"); break;
		case VALIDATE_HAS_UPPERCASE_LETTER: 
			mValidations[i] = new Poco::RegularExpression(".*[A-Z].*"); 
			ServerConfig::g_ServerKeySeed->put(i, DRRandom::r64());
			break;
		case VALIDATE_HAS_LOWERCASE_LETTER: mValidations[i] = new Poco::RegularExpression(".*[a-z].*"); break;
		default: printf("[SessionManager::%s] unknown validation type\n", __FUNCTION__);
		}
	}
	

	mInitalized = true; 
	//mWorkingMutex.unlock();
	return true;
}

void SessionManager::deinitalize()
{
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::deinitalize] exception timout mutex: %s\n", ex.displayText().data());
		return;
	}
	//mWorkingMutex.lock();

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
	//mWorkingMutex.unlock();
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
	const static char* functionName = "SessionManager::getNewSession";
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}

	// first check if we have any timeouted session to directly reuse it
	checkTimeoutSession();

	// lock 
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[%s] exception timout mutex: %s\n", functionName, ex.displayText().data());
		return nullptr;
	}
	//mWorkingMutex.lock();

	//UniLib::controller::TaskPtr checkSessionTimeout(new CheckSessionTimeouted);
	//checkSessionTimeout->scheduleTask(checkSessionTimeout);

	// check if we have an existing session ready to use 
	while (mEmptyRequestStack.size() > 0) {	
		int local_handle = mEmptyRequestStack.top();
		mEmptyRequestStack.pop();
		auto resultIt = mRequestSessionMap.find(local_handle);
		if (resultIt != mRequestSessionMap.end()) {
			Session* result = resultIt->second;
			// check if dead locked
			if (result->tryLock()) {
				result->unlock();
				if (!result->isActive()) {
					result->reset();
					//mWorkingMutex.unlock();

					if (handle) {
						*handle = local_handle;
					}
					result->setActive(true);
					return result;
				}
			}
			else {
				ErrorList errors;
				errors.addError(new Error(functionName, "found dead locked session, keeping in memory without reference"));
				errors.addError(new ParamError(functionName, "last succeeded lock:", result->getLastSucceededLock().data()));
				errors.sendErrorsAsEmail();

				mRequestSessionMap.erase(local_handle);
			}
			
		}
	}
	
	// else create new RequestSession Object
	// calculate random handle
	// check if already exist, if get new
	int newHandle = generateNewUnusedHandle();
	if (!newHandle) {
		//mWorkingMutex.unlock();
		return nullptr;
	}

	auto requestSession = new Session(newHandle);
	mRequestSessionMap.insert(std::pair<int, Session*>(newHandle, requestSession));

	requestSession->setActive(true);
	//mWorkingMutex.unlock();

	if (handle) {
		*handle = newHandle;
	}
	//printf("[SessionManager::getNewSession] handle: %ld, sum: %u\n", newHandle, mRequestSessionMap.size());
	return requestSession;
	

	//return nullptr;
}

bool SessionManager::releaseSession(int requestHandleSession)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::releaseSession] exception timout mutex: %s\n", ex.displayText().data());
		return false;
	}
	//mWorkingMutex.lock();
	
	auto it = mRequestSessionMap.find(requestHandleSession);
	if (it == mRequestSessionMap.end()) {
		//printf("[SessionManager::releaseRequestSession] requestSession with handle: %d not found\n", requestHandleSession);
		//mWorkingMutex.unlock();
		return false;
	}
	Session* session = it->second;
	// check if dead locked
	if (session->tryLock()) {
		session->unlock();
		session->reset();
		session->setActive(false);
	}
	else {
		ErrorList errors;
		errors.addError(new Error("SessionManager::releaseSession", "found dead locked session"));
		errors.sendErrorsAsEmail();
		mRequestSessionMap.erase(requestHandleSession);
		delete session;
		return true;
	}
	
	// change request handle we don't want session hijacking
	
	// hardcoded disabled session max
	if (mEmptyRequestStack.size() > 100) {
		mRequestSessionMap.erase(requestHandleSession);
		delete session;
		return true;
	}

	int newHandle = generateNewUnusedHandle();
	//printf("[SessionManager::releseSession] oldHandle: %ld, newHandle: %ld\n", requestHandleSession, newHandle);
	// erase after generating new number to prevent to getting the same number again
	mRequestSessionMap.erase(requestHandleSession);

	if (!newHandle) {
		delete session;
		//mWorkingMutex.unlock();
		return true;
	}
	
	session->setHandle(newHandle);
	mRequestSessionMap.insert(std::pair<int, Session*>(newHandle, session));
	mEmptyRequestStack.push(newHandle);
	
	//mWorkingMutex.unlock();

	return true;
}

bool SessionManager::isExist(int requestHandleSession)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}
	bool result = false;
	//mWorkingMutex.lock();
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::isExist] exception timout mutex: %s\n", ex.displayText().data());
		return false;
	}
	auto it = mRequestSessionMap.find(requestHandleSession);
	if (it != mRequestSessionMap.end()) {
		result = true;
		if (!it->second->isActive()) {
			printf("[SessionManager::isExist] session isn't active\n");
		}
	}
	//mWorkingMutex.unlock();
	return result;
}

Session* SessionManager::getSession(const Poco::Net::HTTPServerRequest& request)
{
	// check if user has valid session
	Poco::Net::NameValueCollection cookies;
	request.getCookies(cookies);

	int session_id = 0;

	try {
		session_id = atoi(cookies.get("GRADIDO_LOGIN").data());
		return getSession(session_id);
	}
	catch (...) {}

	return nullptr;
}

Session* SessionManager::getSession(int handle)
{
	if (!mInitalized) {
		printf("[SessionManager::%s] not initialized any more\n", __FUNCTION__);
		return nullptr;
	}
	if (0 == handle) return nullptr;
	Session* result = nullptr;
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::getSession] exception timout mutex: %s\n", ex.displayText().data());
		return result;
	}
	//mWorkingMutex.lock();
	auto it = mRequestSessionMap.find(handle);
	if (it != mRequestSessionMap.end()) {
		result = it->second;
		if (!result->isActive()) {
			//printf("[SessionManager::getSession] session isn't active\n");
			//mWorkingMutex.unlock();
			return nullptr;
		}
		//result->setActive(true);
		result->updateTimeout();
	}
	//printf("[SessionManager::getSession] handle: %ld\n", handle);
	//mWorkingMutex.unlock();
	return result;
}

Session* SessionManager::findByEmailVerificationCode(const Poco::UInt64& emailVerificationCode)
{

	auto email_verification = controller::EmailVerificationCode::load(emailVerificationCode);
	if (email_verification.isNull()) return nullptr;
	auto email_verification_model = email_verification->getModel();
	assert(email_verification_model->getUserId() > 0);

	auto session = findByUserId(email_verification_model->getUserId());
	if (session) {
		session->setEmailVerificationCodeObject(email_verification);
	}

	return session;
}

Session* SessionManager::findByUserId(int userId)
{
	assert(userId > 0);
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::findByUserId] exception timout mutex: %s\n", ex.displayText().data());
		return nullptr;
	}
	//mWorkingMutex.lock();
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		auto user = it->second->getNewUser();
		if (userId == user->getModel()->getID()) {
			return it->second;
		}
	}
	//mWorkingMutex.unlock();

	return nullptr;
}

std::vector<Session*> SessionManager::findAllByUserId(int userId)
{
	assert(userId > 0);
	std::vector<Session*> result;
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::findAllByUserId] exception timout mutex: %s\n", ex.displayText().data());
		return result;
	}
	//mWorkingMutex.lock();
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		auto user = it->second->getNewUser();
		if (userId == user->getModel()->getID()) {
			//return it->second;
			result.push_back(it->second);
		}
	}
	//mWorkingMutex.unlock();

	return result;
}

Session* SessionManager::findByEmail(const std::string& email)
{
	assert(email.size() > 0);
	
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::findByEmail] exception timout mutex: %s\n", ex.displayText().data());
		return nullptr;
	}
	//mWorkingMutex.lock();
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		auto user = it->second->getNewUser();
		if (email == user->getModel()->getEmail()) {
			return it->second;
		}
	}
	//mWorkingMutex.unlock();

	return nullptr;
}

void SessionManager::checkTimeoutSession()
{
	
	try {
		Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);
	}
	catch (Poco::TimeoutException &ex) {
		printf("[SessionManager::checkTimeoutSession] exception timeout mutex: %s\n", ex.displayText().data());
		return;
	}
	//mWorkingMutex.lock();
	auto now = Poco::DateTime();
	// random variance within 10 seconds for timeout to make it harder to get information and hack the server
	auto timeout = Poco::Timespan(ServerConfig::g_SessionTimeout * 60, randombytes_random() % 10000000);
	//auto timeout = Poco::Timespan(1, 0);
	std::stack<int> toRemove;
	for (auto it = mRequestSessionMap.begin(); it != mRequestSessionMap.end(); it++) {
		
		if (it->second->tryLock()) {
			it->second->unlock();
			// skip already disabled sessions
			if (!it->second->isActive()) continue;
		}
		else {
			// skip dead locked sessions
			continue;
		}
		
		Poco::Timespan timeElapsed(now - it->second->getLastActivity());
		if (timeElapsed > timeout) {
			toRemove.push(it->first);
		}
	}
	//mWorkingMutex.unlock();

	while (toRemove.size() > 0) {
		int handle = toRemove.top();
		toRemove.pop();
		releaseSession(handle);
	}
	
}

void SessionManager::deleteLoginCookies(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response, Session* activeSession/* = nullptr*/)
{
	Poco::Net::NameValueCollection cookies;
	request.getCookies(cookies);
	// go from first login cookie
	for (auto it = cookies.find("GRADIDO_LOGIN"); it != cookies.end(); it++) {
		// break if no login any more
		if (it->first != "GRADIDO_LOGIN") break;
		// skip if it is from the active session
		if (activeSession) {
			try {
				int session_id = atoi(it->second.data());
				if (session_id == activeSession->getHandle()) continue;
			}
			catch (...) {}
		}
		// delete cookie
		auto keks = Poco::Net::HTTPCookie("GRADIDO_LOGIN", it->second);
		keks.setPath("/");
		// max age of 0 delete cookie
		keks.setMaxAge(0);
		response.addCookie(keks);
	}
	// delete also cake php session cookie
	for (auto it = cookies.find("CAKEPHP"); it != cookies.end(); it++) {
		if (it->first != "CAKEPHP") break;
		// delete cookie
		auto keks = Poco::Net::HTTPCookie("CAKEPHP", it->second);
		keks.setPath("/");
		// max age of 0 delete cookie
		keks.setMaxAge(0);
		response.addCookie(keks);
		//printf("remove PHP Kekse\n");
	}


	//session_id = atoi(cookies.get("GRADIDO_LOGIN").data());
}

bool SessionManager::checkPwdValidation(const std::string& pwd, ErrorList* errorReciver)
{
	if (!isValid(pwd, VALIDATE_PASSWORD)) {
		errorReciver->addError(new Error("Passwort", "Bitte gebe ein g&uuml;ltiges Password ein mit mindestens 8 Zeichen, Gro&szlig;- und Kleinbuchstaben, mindestens einer Zahl und einem Sonderzeichen (@$!%*?&+-_) ein!"));

		// @$!%*?&+-
		if (pwd.size() < 8) {
			errorReciver->addError(new Error("Passwort", "Dein Passwort ist zu kurz!"));
		}
		else if (!isValid(pwd, VALIDATE_HAS_LOWERCASE_LETTER)) {
			errorReciver->addError(new Error("Passwort", "Dein Passwort enth&auml;lt keine Kleinbuchstaben!"));
		}
		else if (!isValid(pwd, VALIDATE_HAS_UPPERCASE_LETTER)) {
			errorReciver->addError(new Error("Passwort", "Dein Passwort enth&auml;lt keine Gro&szlig;buchstaben!"));
		}
		else if (!isValid(pwd, VALIDATE_HAS_NUMBER)) {
			errorReciver->addError(new Error("Passwort", "Dein Passwort enth&auml;lt keine Zahlen!"));
		}
		else if (!isValid(pwd, VALIDATE_HAS_SPECIAL_CHARACTER)) {
			errorReciver->addError(new Error("Passwort", "Dein Passwort enth&auml;lt keine Sonderzeichen (@$!%*?&+-)!"));
		}

		return false;
	}
	return true;
}


int CheckSessionTimeouted::run()
{
	SessionManager::getInstance()->checkTimeoutSession();
	return 0;
}
