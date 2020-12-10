#include "PageRequestHandlerFactory.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DateTime.h"
#include "Poco/DateTimeFormatter.h"

#include "ConfigPage.h"
#include "LoginPage.h"
//#include "RegisterPage.h"
#include "HandleFileRequest.h"
#include "DashboardPage.h"
#include "CheckEmailPage.h"
#include "PassphrasePage.h"
#include "SaveKeysPage.h"
#include "ElopageWebhook.h"
#include "ElopageWebhookLight.h"
#include "UpdateUserPasswordPage.h"
#include "UserUpdateGroupPage.h"
#include "Error500Page.h"
#include "CheckTransactionPage.h"
#include "ResetPassword.h"
#include "RegisterAdminPage.h"
#include "DebugPassphrasePage.h"
#include "DebugMnemonicPage.h"
#include "AdminCheckUserBackup.h"
#include "TranslatePassphrase.h"
#include "PassphrasedTransaction.h"
#include "AdminUserPasswordReset.h"
#include "RegisterDirectPage.h"
#include "AdminGroupsPage.h"
#include "AdminTopicPage.h"
#include "AdminHederaAccountPage.h"
#include "AdminNodeServerPage.h"

#include "DecodeTransactionPage.h"
#include "RepairDefectPassphrase.h"


#include "../SingletonManager/SessionManager.h"

#include "../lib/Profiler.h"
#include "../lib/DataTypeConverter.h"

#include "../ServerConfig.h"
#include "../Crypto/DRRandom.h"

PageRequestHandlerFactory::PageRequestHandlerFactory()
	: mRemoveGETParameters("^/([a-zA-Z0-9_-]*)"), mLogging(Poco::Logger::get("requestLog"))
{
	ServerConfig::g_ServerKeySeed->put(8, DRRandom::r64());
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::basicSetup(PageRequestMessagedHandler* handler, const Poco::Net::HTTPServerRequest& request, Profiler profiler)
{
	handler->setHost(request.getHost());
	handler->setProfiler(profiler);
	return handler;
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest& request)
{
	//printf("request uri: %s\n", request.getURI().data());
	Profiler timeUsed;
	std::string uri = request.getURI();
	std::string url_first_part;
	std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
	mRemoveGETParameters.extract(uri, url_first_part);

	std::string externReferer;

	if (uri != "/favicon.ico") {
		//printf("[PageRequestHandlerFactory] uri: %s, first part: %s\n", uri.data(), url_first_part.data());
		auto referer = request.find("Referer");
		if (referer != request.end()) {
			//printf("referer: %s\n", referer->second.data());
			auto refererString = referer->second;
			if (refererString.find(ServerConfig::g_serverPath) == refererString.npos) {
				externReferer = refererString;
			}
		}//*/
	}

	if (url_first_part == "/elopage_webhook_261") {
		mLogging.information(dateTimeString + " call from elopage");
		return basicSetup(new ElopageWebhook, request, timeUsed);
	}

	if (url_first_part == "/elopage_webhook_211") {
		mLogging.information(dateTimeString + " call from elopage light");
		return basicSetup(new ElopageWebhookLight, request, timeUsed);
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
	logStream << dateTimeString  << " call " << uri;
	if (s) {logStream << ", with session: " << std::to_string(s->getHandle()); }
	if (referer != request.end()) { logStream << ", from: " << referer->second;}
	mLogging.information(logStream.str());
	// end debugging

	// TODO: count invalid session requests from IP and block IP for some time to prevent brute force session hijacking
	// or use log file and configure fail2ban for this to do
	
	if (url_first_part == "/checkEmail") {
		//return new CheckEmailPage(s);
		//printf("url checkEmail\n");
//		if (!s) {
			return handleCheckEmail(s, uri, request, timeUsed);
	//	}
		//printf("skip handleCheckEmail\n");
	}
	/*if (url_first_part == "/register") {
		auto pageRequestHandler = new RegisterPage;
		pageRequestHandler->setProfiler(timeUsed);
		return pageRequestHandler;
	}*/
	if (url_first_part.size() >= 9 && url_first_part.substr(0,9) == "/register") {
	//if (url_first_part == "/register" || url_first_part == "/registerDirect" ) {
		return basicSetup(new RegisterDirectPage, request, timeUsed);
	}
	if (url_first_part == "/resetPassword") {
		return basicSetup(new ResetPassword, request, timeUsed);
	}

	if (url_first_part == "/decode_transaction") {
		mLogging.information(dateTimeString + " decode");
		return basicSetup(new DecodeTransactionPage(s), request, timeUsed);
	}
	if (url_first_part == "/passphrased_transaction") {
		return basicSetup(new PassphrasedTransaction, request, timeUsed);
	}
	if (s) {
		if (externReferer != "") {
			s->setLastReferer(externReferer);
		}
		model::table::User* userModel = nullptr;
		auto newUser = s->getNewUser();
		if (newUser) userModel = newUser->getModel();
		if (s->errorCount() || (userModel && userModel->errorCount())) {
			if (userModel && userModel->errorCount()) {
				s->getErrors(userModel);
			}
			s->sendErrorsAsEmail();
			return basicSetup(new Error500Page(s), request, timeUsed);
		}
		if (url_first_part == "/error500") {
			return basicSetup(new Error500Page(s), request, timeUsed);
		}
		if (url_first_part == "/userUpdateGroup") {
			return basicSetup(new UserUpdateGroupPage(s), request, timeUsed);
		}

		if (url_first_part == "/transform_passphrase") {
			return basicSetup(new TranslatePassphrase(s), request, timeUsed);
		}
		if (url_first_part == "/repairPassphrase") {
			return basicSetup(new RepairDefectPassphrase(s), request, timeUsed);
		}
		if (userModel && userModel->getRole() == model::table::ROLE_ADMIN) {
			if (url_first_part == "/adminRegister") {
				return basicSetup(new RegisterAdminPage(s), request, timeUsed);
			}
			if (url_first_part == "/debugPassphrase") {
				return basicSetup(new DebugPassphrasePage(s), request, timeUsed);
			}
			if (url_first_part == "/debugMnemonic") {
				return basicSetup(new DebugMnemonicPage(s), request, timeUsed);
			}
			if (url_first_part == "/checkUserBackups") {
				return basicSetup(new AdminCheckUserBackup(s), request, timeUsed);
			}
			if (url_first_part == "/adminUserPasswordReset") {
				return basicSetup(new AdminUserPasswordReset(s), request, timeUsed);
			}
			if (url_first_part == "/groups") {
				return basicSetup(new AdminGroupsPage(s), request, timeUsed);
			}
			if (url_first_part == "/topic") {
				return basicSetup(new AdminTopicPage(s), request, timeUsed);
			}
			if (url_first_part == "/hedera_account") {
				return basicSetup(new AdminHederaAccountPage(s), request, timeUsed);
			}
			if (url_first_part == "/nodes") {
				return basicSetup(new AdminNodeServerPage(s), request, timeUsed);
			}
		}

		if(url_first_part == "/logout") {
			sm->releaseSession(s);
			// remove cookie(s)
			
			//printf("session released\n");
			return basicSetup(new LoginPage(nullptr), request, timeUsed);
		}
		if(url_first_part == "/user_delete") {
			if(s->deleteUser()) {
				sm->releaseSession(s);

				return basicSetup(new LoginPage(nullptr), request, timeUsed);
			}			
		}
		auto sessionState = s->getSessionState();
		//printf("session state: %s\n", s->getSessionStateString());
		if (url_first_part == "/updateUserPassword") {
			return basicSetup(new UpdateUserPasswordPage(s), request, timeUsed);
		}
		if (url_first_part == "/checkTransactions") {
			return basicSetup(new CheckTransactionPage(s), request, timeUsed);

		}
		if(s && newUser && newUser->hasPassword() && newUser->hasPublicKey()) {
			//printf("[PageRequestHandlerFactory] go to dashboard page with user\n");
			return basicSetup(new DashboardPage(s), request, timeUsed);
		}
		
	} else {

		if (url_first_part == "/config") {
			return new ConfigPage;
		}
		else if (url_first_part == "/login") {
			return basicSetup(new LoginPage(nullptr), request, timeUsed);
		}
	}
	return basicSetup(new LoginPage(nullptr), request, timeUsed);
	//return new HandleFileRequest;
	//return new PageRequestHandlerFactory;
}

Poco::Net::HTTPRequestHandler* PageRequestHandlerFactory::handleCheckEmail(Session* session, const std::string uri, const Poco::Net::HTTPServerRequest& request, Profiler timeUsed)
{
	Poco::Net::HTMLForm form(request);
	unsigned long long verificationCode = 0;
	Languages lang = LANG_DE;

	// if verification code is valid, go to next page, passphrase
	// login via verification code, if no session is active
	// try to get code from form get parameter
	if (!form.empty()) {
		try {
			verificationCode = stoull(form.get("email-verification-code", "0"));
		} catch (...) {}
		lang = LanguageManager::languageFromString(form.get("lang-btn", "de"));
	}
	// try to get code from uri parameter
	if (!verificationCode) {
		size_t pos = uri.find_last_of("/");
		auto str = uri.substr(pos + 1);
		DataTypeConverter::strToInt(str, verificationCode);
	}

	// if no verification code given or error with given code, show form
	if (!verificationCode) {
		auto pageRequestHandler = new CheckEmailPage(session);
		pageRequestHandler->setProfiler(timeUsed);
		return pageRequestHandler;
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
		session->setLanguage(lang);
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
			auto pageRequestHandler = new CheckEmailPage(session);
			pageRequestHandler->setProfiler(timeUsed);
			return pageRequestHandler;
		}
	}
	// suitable session found or created
	if (session) {
		auto user_host = request.clientAddress().host();
		session->setClientIp(user_host);
		assert(session->getNewUser());
		if (!session->getNewUser()->hasPassword()) {
			// user has no password, maybe account created from elopage webhook
			auto pageRequestHandler = new UpdateUserPasswordPage(session);
			pageRequestHandler->setProfiler(timeUsed);
			return pageRequestHandler;
		}
		/*
		//! \return 1 = konto already exist
		//!        -1 = invalid code
		//!        -2 = critical error
		//!         0 = ok
		*/
		// update session, mark as verified 
		int retUpdateEmailVerification = session->updateEmailVerification(verificationCode);
		printf("[%s] return from update email verification: %d\n", __FUNCTION__, retUpdateEmailVerification);
		if (0 == retUpdateEmailVerification) {
			//printf("[PageRequestHandlerFactory::handleCheckEmail] timeUsed: %s\n", timeUsed.string().data());
			SessionHTTPRequestHandler* pageRequestHandler = nullptr;
			if (model::table::EMAIL_OPT_IN_REGISTER_DIRECT == session->getEmailVerificationType()) {
				printf("return check email page\n");
				pageRequestHandler = new CheckEmailPage(session);
			} else if(SESSION_STATE_RESET_PASSWORD_REQUEST == session->getSessionState()) {
				pageRequestHandler = new UpdateUserPasswordPage(session);
			} else {
				pageRequestHandler = new PassphrasePage(session);
			}
			
			pageRequestHandler->setProfiler(timeUsed);
			return pageRequestHandler;
			
		}
		else if (1 == retUpdateEmailVerification) {
			//auto user = session->getUser();
			//LoginPage* loginPage = new LoginPage(session);
			//loginPage->setProfiler(timeUsed);
			CheckEmailPage* check_email_page = new CheckEmailPage(session);
			check_email_page->setProfiler(timeUsed);
			return check_email_page;
			//return loginPage;
		}
		else if (-1 == retUpdateEmailVerification) {
			auto checkEmail = new CheckEmailPage(session);
			checkEmail->setProfiler(timeUsed);
			checkEmail->getErrors(session);
			sm->releaseSession(session);
			return checkEmail;
		}
		else if (-2 == retUpdateEmailVerification) {
			auto errorPage = new Error500Page(session);
			errorPage->setProfiler(timeUsed);
			return errorPage;
		}
		
	}
	if (session) {
		sm->releaseSession(session);
	}

	auto pageRequestHandler = new CheckEmailPage(nullptr);
	pageRequestHandler->setProfiler(timeUsed);
	return pageRequestHandler;
}
