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

#include <string>
#include <sstream>

class Error
{
public:
	Error(const char* functionName, const char* message);
	~Error();

	const char* getFunctionName() { return mFunctionName.data(); }
	const char* getMessage() { return mMessage.data(); }
	virtual std::string getString(bool withNewline = true);
	virtual std::string getHtmlString();
	


protected:
	std::string mFunctionName;
	std::string mMessage;
};

class ParamError : public Error
{
public: 
	ParamError(const char* functionName, const char* message, const char* param) 
		: Error(functionName, message), mParam(param) {}
	ParamError(const char* functionName, const char* message, const std::string& param)
		: Error(functionName, message), mParam(param) {}

	ParamError(const char* functioName, const char* message, int param)
		: Error(functioName, message) {
		std::stringstream ss;
		ss << param;
		mParam = ss.str();
	}

	virtual std::string getString(bool withNewline = true);
	virtual std::string getHtmlString();
protected:
	std::string mParam;
};



class IErrorCollection
{
public: 
	virtual void addError(Error*, bool log = true) = 0;
};

#endif // DR_LUA_WEB_MODULE_ERROR_ERROR_H
