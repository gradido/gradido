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

class ErrorList : public IErrorCollection
{
public:
	ErrorList();
	~ErrorList();

	// push error, error will be deleted in deconstructor
	virtual void addError(Error* error);

	// return error on top of stack, please delete after using
	Error* getLastError();

	inline size_t errorCount() { return mErrorStack.size(); }

	// delete all errors
	void clearErrors();

	static int moveErrors(ErrorList* recv, ErrorList* send) {
		return recv->getErrors(send);
	}
	int getErrors(ErrorList* send);

	void printErrors();
	std::string getErrorsHtml();

	void sendErrorsAsEmail();

protected:
	std::stack<Error*> mErrorStack;
};

class SendErrorMessage : public UniLib::controller::CPUTask
{
public:
	SendErrorMessage(Poco::Net::MailMessage* message, UniLib::controller::CPUSheduler* scheduler)
		: UniLib::controller::CPUTask(scheduler), mMessage(message) {}

	~SendErrorMessage();

	virtual int run();


protected:
	Poco::Net::MailMessage* mMessage;

};

#endif // DR_LUA_WEB_MODULE_ERROR_ERROR_LIST_H
