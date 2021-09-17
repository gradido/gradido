#include "Notification.h"

Notification::Notification(const char* functionName, const char* message)
	: mFunctionName(functionName), mMessage(message)
{

}

Notification::Notification(const char* functionName, const std::string& message)
	: mFunctionName(functionName), mMessage(message)
{

}

Notification::Notification(const std::string& functionName, const std::string& message)
 : mFunctionName(functionName), mMessage(message)
{

}