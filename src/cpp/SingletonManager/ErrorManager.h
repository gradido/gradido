/*!
*
* \author: einhornimmond
*
* \date: 28.02.19
*
* \brief: manage error log and store errors for retrieving from lua
*/

#ifndef DR_LUA_WEB_MODULE_ERROR_MANAGER_H
#define DR_LUA_WEB_MODULE_ERROR_MANAGER_H

#include <mutex>
#include <ios>
#include <list>
#include <map>
#include <cstring>
#include "../Model/Error.h"
#include "../Crypto/DRHash.h"
#include "../tasks/CPUTask.h"

#include "Poco/Mutex.h"
#include "Poco/Net/MailMessage.h"


class ErrorManager : public IErrorCollection
{
public:
	~ErrorManager();

	static ErrorManager* getInstance();
	
	// will called delete on error 
	virtual void addError(Error* error);

	virtual void sendErrorsAsEmail();

protected:
	ErrorManager();


	// access mutex
	Poco::Mutex mWorkingMutex;
	std::map<DHASH, std::list<Error*>*> mErrorsMap;
	// how many errors should be stored

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

#endif //DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H