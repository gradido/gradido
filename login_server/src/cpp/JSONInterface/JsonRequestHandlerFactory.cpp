
#include "JsonRequestHandlerFactory.h"

#include "Poco/Net/HTTPServerRequest.h"

#include "../SingletonManager/SessionManager.h"

#include "JsonAdminEmailVerificationResend.h"
#include "JsonCheckSessionState.h"
#include "JsonCheckUsername.h"
#include "JsonAppLogin.h"
#include "JsonAquireAccessToken.h"
#include "JsonCreateTransaction.h"
#include "JsonCreateUser.h"
#include "JsonGetLogin.h"
#include "JsonUnknown.h"
#include "JsonGetRunningUserTasks.h"
#include "JsonGetUsers.h"
#include "JsonLoginViaEmailVerificationCode.h"
#include "JsonLogout.h"
#include "JsonNetworkInfos.h"
#include "JsonSendEmail.h"
#include "JsonAdminEmailVerificationResend.h"
#include "JsonGetUserInfos.h"
#include "JsonUnsecureLogin.h"
#include "JsonUpdateUserInfos.h"
#include "JsonUnsecureLogin.h"
#include "JsonSearch.h"


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

	auto client_host = request.clientAddress().host();
	//auto client_ip = request.clientAddress();
	// X-Real-IP forwarded ip from nginx config
	auto client_host_string = request.get("X-Real-IP", client_host.toString());
	client_host = Poco::Net::IPAddress(client_host_string);

	// check if user has valid session
	Poco::Net::NameValueCollection cookies;
	request.getCookies(cookies);

	int session_id = 0;

	try {
		session_id = atoi(cookies.get("GRADIDO_LOGIN").data());
	}
	catch (...) {}

	auto sm = SessionManager::getInstance();
	Session*  s = nullptr;
	if (!session_id) {
		s = sm->getSession(session_id);
	}

	if (url_first_part == "/login") {
		return new JsonGetLogin;
	}
	else if (url_first_part == "/checkSessionState") {
		return new JsonCheckSessionState;
	}
	else if (url_first_part == "/checkUsername") {
		return new JsonCheckUsername;
	}
	else if (url_first_part == "/createTransaction") {
		return new JsonCreateTransaction;
	}
	else if (url_first_part == "/getRunningUserTasks") {
		return new JsonGetRunningUserTasks;
	}
	else if (url_first_part == "/getUsers") {
		return new JsonGetUsers;
	}
	else if (url_first_part == "/networkInfos") {
		return new JsonNetworkInfos;
	}
	else if (url_first_part == "/createUser") {
		return new JsonCreateUser(client_host);
	}
	else if (url_first_part == "/adminEmailVerificationResend") {
		return new JsonAdminEmailVerificationResend;
	}
	else if (url_first_part == "/getUserInfos") {
		return new JsonGetUserInfos;
	}
	else if (url_first_part == "/updateUserInfos") {
		return new JsonUpdateUserInfos(s);
	}
	else if (url_first_part == "/search") {
		return new JsonSearch;
	}
	else if (url_first_part == "/unsecureLogin" && (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS)) {
		return new JsonUnsecureLogin(client_host);
	}
	else if (url_first_part == "/loginViaEmailVerificationCode") {
		return new JsonLoginViaEmailVerificationCode(client_host);
	}
	else if (url_first_part == "/sendEmail") {
		return new JsonSendEmail;
	}
	else if (url_first_part == "/logout") {
		return new JsonLogout(client_host);
	}
	else if (url_first_part == "/acquireAccessToken") {
		auto requestHandler = new JsonAquireAccessToken;
		requestHandler->setSession(s);
		return requestHandler;
	}
	else if (url_first_part == "/unsecureLogin" && (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS)) {
		return new JsonUnsecureLogin(client_host);
	}
	else if (url_first_part == "/appLogin") {
		return new JsonAppLogin;
	}
	else if (url_first_part == "/appLogout") {
		if (s) {
			sm->releaseSession(s);
		}
	}
	else if (url_first_part == "/logout") {
		return new JsonLogout(client_host);
	}

	return new JsonUnknown;
}

