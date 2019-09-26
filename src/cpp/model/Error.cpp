#include "Error.h"


Error::Error(const char* functionName, const char* message)
	: mFunctionName(functionName), mMessage(message)
{

}

Error::~Error()
{

}

std::string Error::getString() 
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << std::endl;

	return ss.str();
}
std::string Error::getHtmlString()
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << std::endl;

	return ss.str();
}

std::string ParamError::getString()
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam << std::endl;

	return ss.str();
}
std::string ParamError::getHtmlString()
{
	std::stringstream ss;
	ss << mFunctionName << ": " << mMessage << " " << mParam << std::endl;

	return ss.str();
}