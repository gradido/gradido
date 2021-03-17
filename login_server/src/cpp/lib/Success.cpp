#include "Success.h"
#include <sstream>

Success::Success(const char* functionName, const char* message)
	: Notification(functionName, message)
{

}

std::string Success::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string Success::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;

	return ss.str();
}

ParamSuccess::ParamSuccess(const char* functionName, const char* message, std::string param)
	: Success(functionName, message), mParam(param)
{

}

ParamSuccess::ParamSuccess(const char* functionName, const char* message, int param)
	: Success(functionName, message), mParam(std::to_string(param))
{

}

std::string ParamSuccess::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string ParamSuccess::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;

	return ss.str();
}