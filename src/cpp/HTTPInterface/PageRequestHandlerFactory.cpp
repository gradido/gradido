#include "PageRequestHandlerFactory.h"
#include "Poco/Net/HTTPServerRequest.h"

#include "ConfigPage.h"
#include "LoginPage.h"
#include "RegisterPage.h"
#include "HandleFileRequest.h"

PageRequestHandlerFactory::PageRequestHandlerFactory()
{
	
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	printf("request uri: %s\n", request.getURI().data());

	std::string uri = request.getURI();

	if (uri == "/") {
		return new ConfigPage;
	}
	else if (uri == "/login") {
		return new LoginPage;
	}
	else if (uri == "/register") {
		return new RegisterPage;
	}
	return new HandleFileRequest;
	//return new PageRequestHandlerFactory;
}