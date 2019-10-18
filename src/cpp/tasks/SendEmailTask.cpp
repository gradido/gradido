#include "SendEmailTask.h"
#include "PrepareEmailTask.h"
#include "../model/Profiler.h"
#include "../SingletonManager/ErrorManager.h"
#include "../ServerConfig.h"

SendEmailTask::SendEmailTask(Poco::Net::MailMessage* mailMessage, UniLib::controller::CPUSheduler* cpuScheduler, size_t additionalTaskDependenceCount/* = 0*/)
	: UniLib::controller::CPUTask(cpuScheduler, additionalTaskDependenceCount+1), mMailMessage(mailMessage)
{

}

SendEmailTask::~SendEmailTask()
{
	if (mMailMessage) {
		delete mMailMessage;
		mMailMessage = nullptr;
	}
}

int SendEmailTask::run() 
{
	Profiler timeUsed;
	auto er = ErrorManager::getInstance();
	auto parent = getParent(0);

	if (strcmp(parent->getResourceType(), "PrepareEmailTask") != 0) {
		er->addError(new Error("SendEmailTask", "first parent isn't PrepareEmailTask"));
		return -1;
	}
	PrepareEmailTask* prepare = (PrepareEmailTask*)&(*parent);
	mMailMessage->setSender(ServerConfig::g_EmailAccount.sender);
	if (prepare->send(mMailMessage)) {
		return -1;
	}
	//printf("[SendEmailTask] time: %s\n", timeUsed.string().data());
	return 0;
}