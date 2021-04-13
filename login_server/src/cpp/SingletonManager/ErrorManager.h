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
#include "../lib/NotificationList.h"
#include "../lib/DRHash.h"
#include "../tasks/CPUTask.h"

#include "Poco/Mutex.h"
#include "Poco/Logger.h"
#include "Poco/Net/MailMessage.h"


class ErrorManager : public INotificationCollection
{
public:
	~ErrorManager();

	static ErrorManager* getInstance();
	
	// will called delete on error 
	virtual void addError(Notification* error, bool log = true);

	int getErrors(NotificationList* send);

	virtual void sendErrorsAsEmail();

protected:
	ErrorManager();

	// access mutex
	Poco::Mutex mWorkingMutex;
	std::map<DHASH, std::list<Notification*>*> mErrorsMap;
	// how many errors should be stored

	// poco logging
	Poco::Logger& mLogging;
};



#endif //DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H