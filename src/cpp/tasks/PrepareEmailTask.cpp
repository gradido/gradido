#include "PrepareEmailTask.h"
#include "../model/Profiler.h"
#include "../ServerConfig.h"
#include "../SingletonManager/ErrorManager.h"

PrepareEmailTask::PrepareEmailTask(UniLib::controller::CPUSheduler* cpuScheduler)
	: UniLib::controller::CPUTask(cpuScheduler), mMailClientSession(nullptr)
{

}

PrepareEmailTask::~PrepareEmailTask()
{
	if (mMailClientSession) {
		delete mMailClientSession;
	}
}

int PrepareEmailTask::run()
{
	Profiler timeUsed;
	mMailClientSession = new Poco::Net::SecureSMTPClientSession(ServerConfig::g_EmailAccount.url, ServerConfig::g_EmailAccount.port);
	mMailClientSession->login();
	mMailClientSession->startTLS(ServerConfig::g_SSL_CLient_Context);

	
	mMailClientSession->login(Poco::Net::SMTPClientSession::AUTH_LOGIN, ServerConfig::g_EmailAccount.username, ServerConfig::g_EmailAccount.password);

	printf("[PrepareEmailTask] time: %s\n", timeUsed.string().data());
	/*
	session.login();
	session.startTLS(pContext);
	if (!username.empty())
	{
		session.login(SMTPClientSession::AUTH_LOGIN, username, password);
	}
	session.sendMessage(message);
	session.close();
	*/

	return 0;
}

int PrepareEmailTask::send(Poco::Net::MailMessage* message)
{
	auto er = ErrorManager::getInstance();
	try {
		mMailClientSession->sendMessage(*message);
		mMailClientSession->close();
	}
	catch (Poco::Exception& exc) {
		er->addError(new ParamError("PrepareEmailTask::send", "error sending email", exc.displayText().data()));
		printf("[PrepareEmailTask::%s] error sending email: %s\n", __FUNCTION__, exc.displayText().data());
		return -1;
	}
	return 0;
}