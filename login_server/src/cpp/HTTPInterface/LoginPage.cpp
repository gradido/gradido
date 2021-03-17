#include "LoginPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"

#include "../gettext.h"

#include "Poco/Net/HTTPCookie.h"
#include "Poco/Net/HTTPServerParams.h"
#include "Poco/Logger.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../SingletonManager/ErrorManager.h"

#line 1 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


LoginPage::LoginPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void LoginPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 18 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"

	const char* pageName = "Login";
	auto sm = SessionManager::getInstance();
	auto lm = LanguageManager::getInstance();
	auto em = ErrorManager::getInstance();

	auto lang = chooseLanguage(request);
	//printf("choose language return: %d\n", lang);
	auto langCatalog = lm->getFreeCatalog(lang);

	std::string presetEmail("");
	if(mSession && mSession->getUser()) {
		presetEmail = mSession->getUser()->getEmail();
	}

	if(!form.empty()) {

		bool langUpdatedByBtn = false;
		auto langBtn = form.get("lang", "");
		if(langBtn != "") {
			langUpdatedByBtn = true;
		}
		/*
		auto langInput = form.get("lang", "");
		auto updatedLang = LANG_NULL;
		if(langBtn != "") {
			updatedLang = chooseLanguage(request, langBtn);
			langUpdatedByBtn = true;
		} else if(langInput != "") {
			updatedLang = chooseLanguage(request, langInput);
		}

		if(updatedLang != LANG_NULL && updatedLang != lang) {
			lang = updatedLang;
			langCatalog = lm->getFreeCatalog(lang);
		}
		 */
		auto email = form.get("login-email", "");
		auto password = form.get("login-password", "");

		if(email != "" && password != "") {
			//auto session = sm->getSession(request);
			//if(!mSession) mSession = sm->findByEmail(email);
			if(!mSession) {
				mSession = sm->getNewSession();
				mSession->setLanguageCatalog(langCatalog);
				// get language
				// first check url, second check language header
				// for debugging client ip
				auto client_host = request.clientAddress().host();
				//auto client_ip = request.clientAddress();
				// X-Real-IP forwarded ip from nginx config
				auto client_host_string = request.get("X-Real-IP", client_host.toString());				
				std::string clientIpString = "client ip: ";
				client_host = Poco::Net::IPAddress(client_host_string);
				clientIpString += client_host_string;
				Poco::Logger::get("requestLog").information(clientIpString);
				// debugging end
				mSession->setClientIp(client_host);
				response.addCookie(mSession->getLoginCookie());
			} else {
				langCatalog = mSession->getLanguageCatalog();
			}
			UserStates user_state;
			try {
				user_state = mSession->loadUser(email, password);
			} catch (Poco::Exception& ex) {
				addError(new ParamError("login", "exception by calling loadUser: ", ex.displayText()));
				sendErrorsAsEmail();
				addError(new Error("Error", "Intern Server error, please try again later"));
			}
			auto user = mSession->getNewUser();

			if(user_state >= USER_LOADED_FROM_DB && !user->getModel()->getPublicKey()) {
				if(mSession->generateKeys(true, true)) {
					user_state = USER_COMPLETE;
					if(user->getModel()->isDisabled()) {
						user_state = USER_DISABLED;
					}
				}
			} else {
				//printf("pubkey exist: %p\n",user->getModel()->getPublicKey());
			}
			getErrors(mSession);

			auto uri_start = request.serverParams().getServerName();
			auto lastExternReferer = mSession->getLastReferer();

			printf("user_state: %d\n", user_state);

			switch(user_state) {
			case USER_EMPTY:
			case USER_PASSWORD_INCORRECT:
				addError(new Error(langCatalog->gettext("Login"), langCatalog->gettext("E-Mail or password isn't right, please try again!")), false);
				if(mSession) {
					getErrors(mSession);
					sm->releaseSession(mSession);
				}
				sm->deleteLoginCookies(request, response);
				break;
			case USER_PASSWORD_ENCRYPTION_IN_PROCESS:
				addError(new Error(langCatalog->gettext("Passwort"), langCatalog->gettext("Passwort wird noch berechnet, bitte versuche es in etwa 1 Minute erneut.")), false);
				break;
			case USER_KEYS_DONT_MATCH:
				addError(new Error(langCatalog->gettext("User"), langCatalog->gettext("Error in saved data, the server admin will look at it.")));
				break;
			case USER_DISABLED: 
				addError(new Error(langCatalog->gettext("User"), langCatalog->gettext("Benutzer ist deaktiviert, kein Login möglich!")));
				if(mSession) {
					getErrors(mSession);
					sm->releaseSession(mSession);
				}
				sm->deleteLoginCookies(request, response);
				break;
			case USER_NO_PRIVATE_KEY:
			case USER_COMPLETE:
			case USER_EMAIL_NOT_ACTIVATED:
				auto referer = request.find("Referer");
				std::string refererString;
				if (referer != request.end()) {
					refererString = referer->second;
				}
				if(lastExternReferer != "") {
					//printf("redirect to: %s\n", lastExternReferer.data());
					response.redirect(lastExternReferer);
				} else if(refererString != "" &&
				          refererString.find("login") == std::string::npos &&
						  refererString.find("logout") == std::string::npos &&
						  refererString.find("user_delete") == std::string::npos &&
						  refererString != ServerConfig::g_serverPath + request.getURI()) {
					std::string uri = request.getURI();
					printf("request uri: %s, redirect to: %s\n", uri.data(), refererString.data());
					response.redirect(refererString);
				} else {
					//printf("redirect to: %s\n", ServerConfig::g_php_serverPath.data());
					response.redirect(ServerConfig::g_php_serverPath + "/");
				}
				return;
			}

		} else if(!langUpdatedByBtn) {
			addError(new Error(langCatalog->gettext("Login"), langCatalog->gettext("Username and password are needed!")), false);
		}

	} else {

		// on enter login page with empty form
		//auto session = sm->getSession(request);
		// remove old cookies and session if exist
		if(mSession) {
			getErrors(mSession);
			sm->releaseSession(mSession);
		}
		sm->deleteLoginCookies(request, response);
	}

#line 3 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"

	bool withMaterialIcons = false;
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 11 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/main.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "        <div class=\"center-form-single\">\n";
	responseStream << "            <div class=\"center-form-header\">\n";
	responseStream << "                <a href=\"";
#line 21 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"center-logo\">\n";
	responseStream << "                    <picture>\n";
	responseStream << "                        <source srcset=\"";
#line 23 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "                        <source srcset=\"";
#line 24 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\">\n";
	responseStream << "                        <img src=\"";
#line 25 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "                    </picture>\n";
	responseStream << "                </a>\n";
	responseStream << "            </div>";
	// end include header.cpsp
	responseStream << "\n";
#line 175 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<!--<input type=\"hidden\" name=\"lang\" value=\"";
#line 176 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( LanguageManager::keyForLanguage(lang) );
	responseStream << "\">-->\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "    ";
	// begin include flags.cpsp
	responseStream << "<div class=\"center-form-selectors\">\n";
	responseStream << "<form method=\"GET\" action=\"\">\n";
	responseStream << "\t<button id=\"flag-england\" name=\"lang\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 3 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"flag-btn\"";
#line 3 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 4 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-england\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "\t<button id=\"flag-germany\" name=\"lang\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 7 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"flag-btn\"";
#line 7 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 8 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-germany\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "</form>\n";
	responseStream << "</div>";
	// end include flags.cpsp
	responseStream << "\n";
	responseStream << "    <div class=\"center-form-form\">\n";
	responseStream << "\t\t<form action=\"";
#line 180 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/\" method=\"POST\">\n";
	responseStream << "\t\t\t<input class=\"form-control\" type=\"text\" name=\"login-email\" placeholder=\"";
#line 181 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail") );
	responseStream << "\" value=\"";
#line 181 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( presetEmail );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t<input class=\"form-control\" type=\"password\" name=\"login-password\" placeholder=\"";
#line 182 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("Password") );
	responseStream << "\" />\n";
	responseStream << "\t\t    <button type=\"submit\" name=\"submit\" class=\"center-form-submit form-button\">";
#line 183 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext(" Login ") );
	responseStream << "</button>\n";
	responseStream << "\t\t</form>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"center-form-bottom\">\n";
	responseStream << "        <div class=\"signup-link\">\n";
	responseStream << "\t      <p>";
#line 188 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("You haven't any account yet? Please follow the link to create one.") );
	responseStream << "</p>\n";
	responseStream << "\t      <a href=\"https://elopage.com/s/gradido/registration-de/payment?locale=de\">\n";
	responseStream << "\t\t\t";
#line 190 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("Create New Account") );
	responseStream << "\n";
	responseStream << "\t\t  </a>\n";
	responseStream << "\t    </div>\n";
	responseStream << "\t\t<div class=\"reset-pwd-link\">\n";
	responseStream << "\t\t\t<a href=\"";
#line 194 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/resetPassword\">";
#line 194 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("Passwort vergessen") );
	responseStream << "</a>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "</div>\n";
	responseStream << "<p>&nbsp;</p>\n";
	responseStream << "<div class=\"container\">\n";
	responseStream << "\t<a href=\"https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing\" target=\"_blank\">Zum Whitepaper</a>\n";
	responseStream << "\t<br>\n";
	responseStream << "\t<br>\n";
	responseStream << "\t<a href=\"https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing\" target=\"_blank\">To the Whitepaper</a>\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "            <div class=\"center-bottom\">\n";
	responseStream << "                <p>Copyright © Gradido 2020</p>\n";
	responseStream << "            </div>\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomleft\">\n";
	responseStream << "            ";
#line 6 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomright\">\n";
	responseStream << "            <p>Login Server in Entwicklung</p>\n";
	responseStream << "            <p>Alpha ";
#line 10 "F:\\Gradido\\gradido_login_server_v1\\src\\cpsp\\footer.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "        </div>\n";
	responseStream << "    </div>\n";
	responseStream << "</body>\n";
	responseStream << "\n";
	responseStream << "</html>";
	// end include footer.cpsp
	if (_compressResponse) _gzipStream.close();
}
