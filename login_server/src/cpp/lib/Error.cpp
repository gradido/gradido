#include "Error.h"


Error::Error(const char* functionName, const char* message)
	: mFunctionName(functionName), mMessage(message)
{

}

Error::~Error()
{

}

std::string Error::getString(bool withNewline/* = true*/)
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;
	if(withNewline) ss << std::endl;

	return ss.str();
}
std::string Error::getHtmlString()
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage;

	return ss.str();
}

std::string ParamError::getString(bool withNewline/* = true*/)
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam;
	if (withNewline) ss << std::endl;

	return ss.str();
}
std::string ParamError::getHtmlString()
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam << std::endl;

	return ss.str();
}
