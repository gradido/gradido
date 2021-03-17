#include "AuthenticatedEncryptionCreateKeyTask.h"

#include "../ServerConfig.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../lib/Profiler.h"

AuthenticatedEncryptionCreateKeyTask::AuthenticatedEncryptionCreateKeyTask(Poco::AutoPtr<controller::User> user, const std::string& passwd)
	: UniLib::controller::CPUTask(ServerConfig::g_CryptoCPUScheduler), mUser(user), mPassword(passwd)
{
	assert(!mUser.isNull());
	SingletonTaskObserver::getInstance()->addTask(mUser->getModel()->getEmail(), TASK_OBSERVER_PASSWORD_CREATION);
}

AuthenticatedEncryptionCreateKeyTask::~AuthenticatedEncryptionCreateKeyTask()
{
	SingletonTaskObserver::getInstance()->removeTask(mUser->getModel()->getEmail(), TASK_OBSERVER_PASSWORD_CREATION);
}

int AuthenticatedEncryptionCreateKeyTask::run()
{
	auto em = ErrorManager::getInstance();
	const static char* function_name = "AuthenticatedEncryptionCreateKeyTask::run";
	auto authenticated_encryption = new AuthenticatedEncryption;
	Profiler timeUsed;
	if (AuthenticatedEncryption::AUTH_ENCRYPT_OK != authenticated_encryption->createKey(mUser->getModel()->getEmail(), mPassword)) {
		em->addError(new Error(function_name, "error creating key"));
		em->addError(new ParamError(function_name, "for email", mUser->getModel()->getEmail()));
		em->addError(new ParamError(function_name, "strerror: ", strerror(errno)));
		em->sendErrorsAsEmail();
		return -1;
	}
	printf("create password time: %s\n", timeUsed.string().data());
	timeUsed.reset();
	mUser->setNewPassword(authenticated_encryption);
	printf("set password time: %s\n", timeUsed.string().data());

	return 0;
}