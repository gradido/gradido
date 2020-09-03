#include "NotificationList.h"

#include "../ServerConfig.h"

//#include "Poco/Net/MailMessage.h"
#include "Poco/Net/MediaType.h"

#include "../SingletonManager/EmailManager.h"

SendErrorMessage::~SendErrorMessage()
{
	if (mMessage) {
		delete mMessage;
		mMessage = nullptr;
	}
}

int SendErrorMessage::run()
{
	if (ServerConfig::g_disableEmail) return 0;
	
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


NotificationList::NotificationList()
	: mLogging(Poco::Logger::get("errorLog"))
{

}

NotificationList::~NotificationList()
{
	while (mErrorStack.size() > 0) {
		delete mErrorStack.top();
		mErrorStack.pop();
	}
}

void NotificationList::addError(Notification* error, bool log/* = true */)
{

	if (log) {
		std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
		mLogging.error("%s [ErrorList::addError] %s", dateTimeString, error->getString(false));

	}
	mErrorStack.push(error);
}

void NotificationList::addNotification(Notification* notification)
{
	mErrorStack.push(notification);
}

Notification* NotificationList::getLastError()
{
	if (mErrorStack.size() == 0) {
		return nullptr;
	}

	Notification* error = mErrorStack.top();
	if (error) {
		mErrorStack.pop();
	}

	return error;
}

void NotificationList::clearErrors()
{
	while (mErrorStack.size()) {
		auto error = mErrorStack.top();
		if (error) {
			delete error;
		}
		mErrorStack.pop();
	}
}


int NotificationList::getErrors(NotificationList* send)
{
	Notification* error = nullptr;
	int iCount = 0;
	while (error = send->getLastError()) {
		addError(error, false);
		iCount++;
	}
	return iCount;
}

void NotificationList::printErrors()
{
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		printf(error->getString().data());
		delete error;
	}
}

std::string NotificationList::getErrorsHtml()
{
	std::string res;
	res = "<ul class='grd-no-style'>";
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		if (error->isError()) {
			res += "<li class='grd-error'>";
		}
		else if (error->isSuccess()) {
			res += "<li class='grd-success'>";
		}
		res += error->getHtmlString();
		res += "</li>";
		delete error;
	}
	res += "</ul>";
	return res;
}

std::string NotificationList::getErrorsHtmlNewFormat()
{
	std::string html;
	
	while (mErrorStack.size() > 0) {
		auto error = std::unique_ptr<Notification>(mErrorStack.top());
		mErrorStack.pop();
		if (error->isError()) {
			html += "<div class=\"alert alert-error\" role=\"alert\">";
			html += "<i class=\"material-icons-outlined\">report_problem</i>";
		}
		else if (error->isSuccess()) {
			html += "<div class=\"alert alert-success\" role=\"alert\">";
		}
		html += "<span>";
		html += error->getHtmlString();
		html += "</span>";
		html += "</div>";
	}
	return html;
}
/*
<div class="alert alert-error" role="alert">
<i class="material-icons-outlined">report_problem</i>
<span>Der Empfänger wurde nicht auf dem Login-Server gefunden, hat er sein Konto schon angelegt?</span>
</div>
*/


void NotificationList::sendErrorsAsEmail(std::string rawHtml/* = ""*/)
{
	auto em = EmailManager::getInstance();
	/*auto message = new Poco::Net::MailMessage();
	message->setSender("gradido_loginServer@gradido.net");
	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, "***REMOVED***"));
	message->setSubject("Error from Gradido Login Server");
	*/
	std::string content;
	while (mErrorStack.size() > 0) {
		auto error = mErrorStack.top();
		mErrorStack.pop();
		content += error->getString();
		delete error;
	}
	auto email = new model::Email(content, model::EMAIL_ERROR);
	
	//message->addContent(new Poco::Net::StringPartSource(content));
	if (rawHtml != "") {
		Poco::Net::MediaType mt("text", "html");
		mt.setParameter("charset", "utf-8");

		email->addContent(new Poco::Net::StringPartSource(rawHtml, mt.toString()));
	}
	em->addEmail(email);

	//UniLib::controller::TaskPtr sendErrorMessageTask(new SendErrorMessage(message, ServerConfig::g_CPUScheduler));
	//sendErrorMessageTask->scheduleTask(sendErrorMessageTask);

}