/*!
*
* \author: einhornimmond
*
* \date: 07.03.19
*
* \brief: error data
*/

#ifndef DR_LUA_WEB_MODULE_ERROR_ERROR_H
#define DR_LUA_WEB_MODULE_ERROR_ERROR_H

#include "Notification.h"
#include <string>
#include <sstream>


class Error : public Notification
{
public:
	Error(const char* functionName, const char* message);
	Error(const char* functionName, const std::string& message);
	~Error();

	const char* getFunctionName() { return mFunctionName.data(); }
	const char* getMessage() { return mMessage.data(); }
	virtual std::string getString(bool withNewline = true) const;
	virtual std::string getHtmlString() const;

	virtual bool isError() { return true; }

protected:
	
};

class ParamError : public Error
{
public: 
	ParamError(const char* functionName, const char* message, const char* param) 
		: Error(functionName, message), mParam(param) {}
	ParamError(const char* functionName, const char* message, const std::string& param)
		: Error(functionName, message), mParam(param) {}
	ParamError(const char* functionName, const std::string& message, const std::string& param)
		: Error(functionName, message), mParam(param) {}

	ParamError(const char* functioName, const char* message, int param)
		: Error(functioName, message) {
		std::stringstream ss;
		ss << param;
		mParam = ss.str();
	}

	virtual std::string getString(bool withNewline = true) const;
	virtual std::string getHtmlString() const;
protected:
	std::string mParam;
};



class INotificationCollection
{
public: 
	virtual void addError(Notification*, bool log = true) = 0;
};

#endif // DR_LUA_WEB_MODULE_ERROR_ERROR_H
