#include "ErrorList.h"

#include "../ServerConfig.h"

#include "Poco/Net/MailMessage.h"

SendErrorMessage::~SendErrorMessage()
{
	if (mMessage) {
		delete mMessage;
		mMessage = nullptr;
	}
}

int SendErrorMessage::run()
{
	auto mailClientSession = new Poco::Net::SecureSMTPClientSession(ServerConfig::g_EmailAccount.url, ServerConfig::g_EmailAccount.port);
	mailClientSession->login();
	mailClientSession->startTLS(ServerConfig::g_SSL_CLient_Context);


	mailClientSession->login(Poco::Net::SMTPClientSession::AUTH_LOGIN, ServerConfig::g_EmailAccount.username, ServerConfig::g_EmailAccount.password);

	try {
		mMessage->setSender(ServerConfig::g_EmailAccount.sender);
		mailClientSession->sendMessage(*mMessage);
		mailClientSession->close();
	}
	catch (Poco::Exception& exc) {
		printf("[SendErrorMessage::%s] error sending error message to admin: %s\n",
			__FUNCTION__, exc.displayText().data());
		return -1;
	}
	return 0;
}

// ------------------------------------------------------------------------------------


ErrorList::ErrorList()
{

}

ErrorList::~ErrorList()
{
	while (mErrorStack.size() > 0) {
		delete mErrorStack.top();
		mErrorStack.pop();
	}
}

void ErrorList::addError(Error* error)
{
	mErrorStack.push(error);
}

Error* ErrorList::getLastError()
{
	if (mErrorStack.size() == 0) {
		return nullptr;
	}

	Error* error = mErrorStack.top();
	if (error) {
		mErrorStack.pop();
	}

	return error;
}

void ErrorList::clearErrors()
{
	while (mErrorStack.size()) {
		auto error = mErrorStack.top();
		if (error) {
			delete error;
		}
		mErrorStack.pop();
	}
}


int ErrorList::getErrors(ErrorList* send)
{
	Error* error = nullptr;
	int iCount = 0;
	while (error = send->getLastError()) {
		addError(error);
		iCount++;
	}
	return iCount;
}

void ErrorList::printErrors()
{
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		printf(error->getString().data());
		delete error;
	}
}

std::string ErrorList::getErrorsHtml()
{
	std::string res;
	res = "<ul class='grd-no-style'>";
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		res += "<li class='grd-error'>";
		res += error->getHtmlString();
		res += "</li>";
		delete error;
	}
	res += "</ul>";
	return res;
}


void ErrorList::sendErrorsAsEmail()
{
	auto message = new Poco::Net::MailMessage();
	message->setSender("gradido_loginServer@gradido.net");
	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, "***REMOVED***"));
	message->setSubject("Error from Gradido Login Server");

	std::string content;
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		content += error->getString();
		delete error;
	}
	
	message->addContent(new Poco::Net::StringPartSource(content));
	UniLib::controller::TaskPtr sendErrorMessageTask(new SendErrorMessage(message, ServerConfig::g_CPUScheduler));
	sendErrorMessageTask->scheduleTask(sendErrorMessageTask);

}