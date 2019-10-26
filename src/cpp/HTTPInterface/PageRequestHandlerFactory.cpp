#include "PageRequestHandlerFactory.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTMLForm.h"

#include "ConfigPage.h"
#include "LoginPage.h"
#include "RegisterPage.h"
#include "HandleFileRequest.h"
#include "DashboardPage.h"
#include "CheckEmailPage.h"
#include "PassphrasePage.h"
#include "SaveKeysPage.h"
#include "ElopageWebhook.h"
#include "UpdateUserPasswordPage.h"
#include "Error500Page.h"
#include "CheckTransactionPage.h"


#include "../SingletonManager/SessionManager.h"

#include "../model/Profiler.h"

#include "../ServerConfig.h"
#include "../Crypto/DRRandom.h"

PageRequestHandlerFactory::PageRequestHandlerFactory()
	: mRemoveGETParameters("^/([a-zA-Z0-9_-]*)"), mLogging(Poco::Logger::get("requestLog"))
{
	ServerConfig::g_ServerKeySeed->put(8, DRRandom::r64());
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	//printf("request uri: %s\n", request.getURI().data());

	std::string uri = request.getURI();
	std::string url_first_part;
	mRemoveGETParameters.extract(uri, url_first_part);

	if (uri != "/favicon.ico") {
		//printf("[PageRequestHandlerFactory] uri: %s, first part: %s\n", uri.data(), url_first_part.data());
		/*auto referer = request.find("Referer");
		if (referer != request.end()) {
			printf("referer: %s\n", referer->second.data());
		}*/
	}

	if (url_first_part == "/elopage_webhook_261") {
		printf("call from elopage\n");
		return new ElopageWebhook;
	}

	// check if user has valid session
	Poco::Net::NameValueCollection cookies;
	request.getCookies(cookies);

	int session_id = 0;

	try {
		session_id = atoi(cookies.get("GRADIDO_LOGIN").data());
	} catch (...) {}
	auto sm = SessionManager::getInstance();
	auto s = sm->getSession(session_id);

	// for debugging
	std::stringstream logStream;
	auto referer = request.find("Referer");
	logStream << "call " << uri;
	if (s) {logStream << ", with session: " << std::to_string(s->getHandle()); }
	if (referer != request.end()) { logStream << ", from: " << referer->second;}
	mLogging.information(logStream.str());
	// end debugging

	// TODO: count invalid session requests from IP and block IP for some time to prevent brute force session hijacking
	// or use log file and configure fail2ban for this to do
	
	if (url_first_part == "/checkEmail") {
		//return new CheckEmailPage(s);
		if (!s || s->getSessionState() < SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED) {
			return handleCheckEmail(s, uri, request);
		}
	}
	if (url_first_part == "/register") {
		return new RegisterPage;
	}
	if (s) {
		auto user = s->getUser();
		if (s->errorCount() || (!user.isNull() && user->errorCount())) {
			return new Error500Page(s);
		}

		if(url_first_part == "/logout") {
			sm->releaseSession(s);
			// remove cookie
			
			//printf("session released\n");
			return new LoginPage;
		}
		if(url_first_part == "/user_delete") {
			if(s->deleteUser()) {
				sm->releaseSession(s);
				return new LoginPage;			
			}			
		}
		auto sessionState = s->getSessionState();
		if(sessionState == SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED || 
		   sessionState == SESSION_STATE_PASSPHRASE_GENERATED) {
		//if (url_first_part == "/passphrase") {
			//return handlePassphrase(s, request);
			return new PassphrasePage(s);
		}
		else if(sessionState == SESSION_STATE_PASSPHRASE_SHOWN) {
		//else if (uri == "/saveKeys") {
			return new SaveKeysPage(s);
		}
		if (url_first_part == "/checkTransactions") {
			return new CheckTransactionPage(s);
		}
		if (s && !user.isNull() && user->hasCryptoKey()) {
			//printf("[PageRequestHandlerFactory] go to dashboard page with user\n");
			return new DashboardPage(s);
		}
		
	} else {

		if (url_first_part == "/config") {
			return new ConfigPage;
		}
		else if (url_first_part == "/login") {
			return new LoginPage;
		}
	}
	return new LoginPage;
	//return new HandleFileRequest;
	//return new PageRequestHandlerFactory;
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::handleCheckEmail(Session* session, const std::string uri, const Poco::Net::HTTPServerRequest& request)
{
	Profiler timeUsed;
	Poco::Net::HTMLForm form(request);
	unsigned long long verificationCode = 0;

	// if verification code is valid, go to next page, passphrase
	// login via verification code, if no session is active
	// try to get code from form get parameter
	if (!form.empty()) {
		try {
			verificationCode = stoull(form.get("email-verification-code", "0"));
		} catch (...) {}
	}
	// try to get code from uri parameter
	if (!verificationCode) {
		size_t pos = uri.find_last_of("/");
		try {
			auto str = uri.substr(pos + 1);
			verificationCode = stoull(uri.substr(pos + 1));
		} catch (const std::invalid_argument& ia) {
			std::cerr << "Invalid argument: " << ia.what() << '\n';
		} catch (const std::out_of_range& oor) {
			std::cerr << "Out of Range error: " << oor.what() << '\n';
		}
		catch (const std::logic_error & ler) {
			std::cerr << "Logical error: " << ler.what() << '\n';
		}
		catch (...) {
			std::cerr << "Unknown error" << '\n';
		}
	}

	// if no verification code given or error with given code, show form
	if (!verificationCode) {
		return new CheckEmailPage(session);
	}

	// we have a verification code, now let's check that thing
	auto sm = SessionManager::getInstance();

	// no session or active session don't belong to verification code
	if (!session || session->getEmailVerificationCode() != verificationCode) {
		//sm->releaseSession(session);
		//session = nullptr;
		// it is maybe unsafe
		session = sm->findByEmailVerificationCode(verificationCode);
	}
	// no suitable session in memory, try to create one from db data
	if (!session) {
		session = sm->getNewSession();
		if (session->loadFromEmailVerificationCode(verificationCode)) {
			// login not possible in this function, forwarded to PassphrasePage
			/*auto cookie_id = session->getHandle();
			auto user_host = request.clientAddress().host();
			session->setClientIp(user_host);
			response.addCookie(Poco::Net::HTTPCookie("user", std::to_string(cookie_id)));
			*/
		}
		else {	
			//sm->releaseSession(session);
			return new CheckEmailPage(session);
		}
	}
	// suitable session found or created
	if (session) {
		auto user_host = request.clientAddress().host();
		session->setClientIp(user_host);

		if (session->getUser()->isEmptyPassword()) {
			// user has no password, maybe account created from elopage webhook
			return new UpdateUserPasswordPage(session);
		}

		// update session, mark as verified 
		if (session->updateEmailVerification(verificationCode)) {
			printf("[PageRequestHandlerFactory::handleCheckEmail] timeUsed: %s\n", timeUsed.string().data());
			return new PassphrasePage(session);
		}
		
	}
	if (session) {
		sm->releaseSession(session);
	}
	
	return new CheckEmailPage(nullptr);
	
}
