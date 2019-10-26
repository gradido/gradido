#include "JsonRequestHandlerFactory.h"

#include "Poco/Net/HTTPServerRequest.h"

#include "../SingletonManager/SessionManager.h"

#include "JsonGetLogin.h"
#include "JsonUnknown.h"
#include "JsonTransaction.h"

JsonRequestHandlerFactory::JsonRequestHandlerFactory()	
	: mRemoveGETParameters("^/([a-zA-Z0-9_-]*)")
{
}

Poco::Net::HTTPRequestHandler* JsonRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	std::string uri = request.getURI();
	std::string url_first_part;
	mRemoveGETParameters.extract(uri, url_first_part);

	if (url_first_part == "/login") {
		return new JsonGetLogin;
	}
	else if (url_first_part == "/checkTransaction") {
		return new JsonTransaction;
	}

	return new JsonUnknown;
}
