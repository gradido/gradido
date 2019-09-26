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

class ErrorManager : public IErrorCollection
{
public:
	~ErrorManager();

	static ErrorManager* getInstance();
	
	// will called delete on error 
	virtual void addError(Error* error);

protected:
	ErrorManager();


	// access mutex
	std::mutex mWorkingMutex;
	std::map<DHASH, std::list<Error*>*> mErrorsMap;
	// how many errors should be stored

};

#endif //DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H