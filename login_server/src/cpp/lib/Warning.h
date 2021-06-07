#ifndef GRADIDO_LOGIN_SERVER_LIB_WARNING_H
#define GRADIDO_LOGIN_SERVER_LIB_WARNING_H

#include "Notification.h"

class Warning : public Notification
{
public:
	Warning(const char* functionName, const char* message);
	Warning(const std::string& functionName, const std::string& message);

	std::string getString(bool withNewline = true) const;
	std::string getHtmlString() const;

	virtual bool isWarning() { return true; }
};

class ParamWarning : public Warning
{
public:
	ParamWarning(const char* functionName, const char* message, std::string param);
	ParamWarning(const char* functionName, const char* message, int param);

	std::string getString(bool withNewline = true) const;
	std::string getHtmlString() const;

protected:
	std::string mParam;
};

#endif //GRADIDO_LOGIN_SERVER_LIB_WARNING_H