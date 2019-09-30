#include "PageRequestHandlerFactory.h"
#include "Poco/Net/HTTPServerRequest.h"


#include "ConfigPage.h"
#include "LoginPage.h"
#include "RegisterPage.h"
#include "HandleFileRequest.h"
#include "DashboardPage.h"
#include "CheckEmailPage.h"

#include "../SingletonManager/SessionManager.h"

PageRequestHandlerFactory::PageRequestHandlerFactory()
{
	
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	//printf("request uri: %s\n", request.getURI().data());

	std::string uri = request.getURI();

	auto referer = request.find("Referer");
	if (referer != request.end()) {
		printf("referer: %s\n", referer->second.data());
	}

	// check if user has valid session
	Poco::Net::NameValueCollection cookies;
	request.getCookies(cookies);

	int session_id = 0;

	try {
		session_id = atoi(cookies.get("user").data());
	} catch (...) {}
	auto sm = SessionManager::getInstance();
	auto s = sm->getSession(session_id);
	if (uri == "/checkEmail") {
		return new CheckEmailPage(s);
	}
	if (s) {
		
		return new DashboardPage(s);
	} else {

		if (uri == "/") {
			return new ConfigPage;
		}
		else if (uri == "/login") {
			return new LoginPage;
		}
		else if (uri == "/register") {
			return new RegisterPage;
		}
	}
	return new HandleFileRequest;
	//return new PageRequestHandlerFactory;
}