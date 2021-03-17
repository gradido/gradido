#include "SendEmailTask.h"
#include "PrepareEmailTask.h"
#include "../lib/Profiler.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/EmailManager.h"
#include "../ServerConfig.h"

#include "Poco/Net/MediaType.h"

SendEmailTask::SendEmailTask(Poco::Net::MailMessage* mailMessage, UniLib::controller::CPUSheduler* cpuScheduler, size_t additionalTaskDependenceCount/* = 0*/)
	: UniLib::controller::CPUTask(cpuScheduler, additionalTaskDependenceCount+1), mMailMessage(mailMessage), mEmail(nullptr)
{
}

SendEmailTask::SendEmailTask(model::Email*email, UniLib::controller::CPUSheduler* cpuScheduler, size_t additionalTaskDependenceCount/* = 0*/)
	: UniLib::controller::CPUTask(cpuScheduler, additionalTaskDependenceCount), mMailMessage(nullptr), mEmail(email)
{

}

SendEmailTask::~SendEmailTask()
{
	if (mMailMessage) {
		delete mMailMessage;
		mMailMessage = nullptr;
	}
	if (mEmail) {
		delete mEmail;
		mEmail = nullptr;
	}

}

int SendEmailTask::run() 
{
	if(ServerConfig::g_disableEmail) return 0;
	
	Profiler timeUsed;
	auto er = ErrorManager::getInstance();
	auto parent = getParent(0);

	if (mMailMessage) {

		if (strcmp(parent->getResourceType(), "PrepareEmailTask") != 0) {
			er->addError(new Error("SendEmailTask", "first parent isn't PrepareEmailTask"));
			er->sendErrorsAsEmail();
			return -1;
		}
		PrepareEmailTask* prepare = (PrepareEmailTask*)&(*parent);
		mMailMessage->setSender(ServerConfig::g_EmailAccount.sender);

		if (prepare->send(mMailMessage)) {
			er->sendErrorsAsEmail();
			return -1;
		}
	}
	else if (mEmail) {
		auto em = EmailManager::getInstance();
		em->addEmail(mEmail);
		mEmail = nullptr;
	}
	//printf("[SendEmailTask] time: %s\n", timeUsed.string().data());
	return 0;
}