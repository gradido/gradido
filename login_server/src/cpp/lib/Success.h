#ifndef GRADIDO_LOGIN_SERVER_LIB_SUCCESS_H
#define GRADIDO_LOGIN_SERVER_LIB_SUCCESS_H

#include "Notification.h"

class Success : public Notification
{
public:
	Success(const char* functionName, const char* message);

	std::string getString(bool withNewline = true) const;
	std::string getHtmlString() const;

	virtual bool isSuccess() { return true; }
};

class ParamSuccess : public Success
{
public:
	ParamSuccess(const char* functionName, const char* message, std::string param);
	ParamSuccess(const char* functionName, const char* message, int param);

	std::string getString(bool withNewline = true) const;
	std::string getHtmlString() const;

protected:
	std::string mParam;
};

#endif //GRADIDO_LOGIN_SERVER_LIB_SUCCESS_H