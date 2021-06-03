#include "Error.h"


Error::Error(const char* functionName, const char* message)
	: Notification(functionName, message)
{

}

Error::Error(const char* functionName, const std::string& message)
    : Notification(functionName, message)
{

}

Error::~Error()
{

}

std::string Error::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;
	if(withNewline) ss << std::endl;

	return ss.str();
}
std::string Error::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;

	return ss.str();
}

std::string ParamError::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string ParamError::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam << std::endl;

	return ss.str();
}
