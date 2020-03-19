#include "JsonRequestHandlerFactory.h"

#include "Poco/Net/HTTPServerRequest.h"

#include "../SingletonManager/SessionManager.h"

#include "JsonGetLogin.h"
#include "JsonUnknown.h"
#include "JsonTransaction.h"
#include "JsonGetRunningUserTasks.h"
#include "JsonGetUsers.h"
#include "JsonAdminEmailVerificationResend.h"

JsonRequestHandlerFactory::JsonRequestHandlerFactory()	
	: mRemoveGETParameters("^/([a-zA-Z0-9_-]*)"), mLogging(Poco::Logger::get("requestLog"))
{
}

Poco::Net::HTTPRequestHandler* JsonRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	std::string uri = request.getURI();
	std::string url_first_part;
	std::stringstream logStream;

	mRemoveGETParameters.extract(uri, url_first_part);

	std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
	logStream << dateTimeString << " call " << uri;

	mLogging.information(logStream.str());

	if (url_first_part == "/login") {
		return new JsonGetLogin;
	}
	else if (url_first_part == "/checkTransaction") {
		return new JsonTransaction;
	}
	else if (url_first_part == "/getRunningUserTasks") {
		return new JsonGetRunningUserTasks;
	}
	else if (url_first_part == "/getUsers") {
		return new JsonGetUsers;
	} 
	else if (url_first_part == "/adminEmailVerificationResend") {
		return new JsonAdminEmailVerificationResend;
	}

	return new JsonUnknown;
}
