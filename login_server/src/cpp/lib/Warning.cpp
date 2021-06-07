#include "Warning.h"
#include <sstream>

Warning::Warning(const char* functionName, const char* message)
	: Notification(functionName, message)
{

}

Warning::Warning(const std::string& functionName, const std::string& message)
	: Notification(functionName, message)
{

}

std::string Warning::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string Warning::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;

	return ss.str();
}

ParamWarning::ParamWarning(const char* functionName, const char* message, std::string param)
	: Warning(functionName, message), mParam(param)
{

}

ParamWarning::ParamWarning(const char* functionName, const char* message, int param)
	: Warning(functionName, message), mParam(std::to_string(param))
{

}

std::string ParamWarning::getString(bool withNewline/* = true*/) const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string ParamWarning::getHtmlString() const
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;

	return ss.str();
}