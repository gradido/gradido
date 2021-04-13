/*!
*
* \author: einhornimmond
*
* \date: 07.03.19
*
* \brief: error
*/

#ifndef DR_LUA_WEB_MODULE_ERROR_ERROR_LIST_H
#define DR_LUA_WEB_MODULE_ERROR_ERROR_LIST_H

#include "Error.h"
#include <stack>

#include "../tasks/CPUTask.h"

#include "Poco/Net/SecureSMTPClientSession.h"
#include "Poco/Net/StringPartSource.h"
#include "Poco/Logger.h"

class NotificationList : public INotificationCollection
{
public:
	NotificationList();
	~NotificationList();

	// push error, error will be deleted in deconstructor
	virtual void addError(Notification* error, bool log = true);
	void addNotification(Notification* notification);

	// return error on top of stack, please delete after using
	Notification* getLastError();

	inline size_t errorCount() { return mErrorStack.size(); }

	// delete all errors
	void clearErrors();

	static int moveErrors(NotificationList* recv, NotificationList* send) {
		return recv->getErrors(send);
	}
	int getErrors(NotificationList* send);

	void printErrors();
	std::string getErrorsHtml();
	std::string getErrorsHtmlNewFormat();
	std::vector<std::string> getErrorsArray();

	void sendErrorsAsEmail(std::string rawHtml = "", bool copy = false);

protected:
	std::stack<Notification*> mErrorStack;
	// poco logging
	Poco::Logger& mLogging;
};

class SendErrorMessage : public UniLib::controller::CPUTask
{
public:
	SendErrorMessage(Poco::Net::MailMessage* message, UniLib::controller::CPUSheduler* scheduler)
		: UniLib::controller::CPUTask(scheduler), mMessage(message) {}

	~SendErrorMessage();

	virtual int run();
	const char* getResourceType() const { return "SendErrorMessage"; };


protected:
	Poco::Net::MailMessage* mMessage;

};

#endif // DR_LUA_WEB_MODULE_ERROR_ERROR_LIST_H
