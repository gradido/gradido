#ifndef GRADIDO_LOGIN_SERVER_LIB_NOTIFICATION_H
#define GRADIDO_LOGIN_SERVER_LIB_NOTIFICATION_H

#include <string>

class Notification
{
public:
	Notification(const char* functionName, const char* message);
	Notification(const char* functionName, const std::string& message);
	Notification(const std::string& functionName, const std::string& message);

	const char* getFunctionName() { return mFunctionName.data(); }
	const char* getMessage() { return mMessage.data(); }
	virtual std::string getString(bool withNewline = true) const = 0;
	virtual std::string getHtmlString() const = 0;

	virtual bool isError() { return false; }
	virtual bool isSuccess() { return false; }
	virtual bool isWarning() { return false; }

protected:
	std::string mFunctionName;
	std::string mMessage;
};

#endif //GRADIDO_LOGIN_SERVER_LIB_NOTIFICATION_H