#include "LoginPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 
#include "../gettext.h"

#include "Poco/Net/HTTPCookie.h"
#include "Poco/Net/HTTPServerParams.h"
#include "Poco/Logger.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
	
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 
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
#line 17 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 
	const char* pageName = "Login";
	auto sm = SessionManager::getInstance();
	auto lm = LanguageManager::getInstance();
	
	auto lang = chooseLanguage(request);
	auto langCatalog = lm->getFreeCatalog(lang);
	
	std::string presetEmail("");
	if(mSession && mSession->getUser()) {
		presetEmail = mSession->getUser()->getEmail();
	}
	
	if(!form.empty()) {
		bool langUpdatedByBtn = false;
		auto langBtn = form.get("lang-btn", "");
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
		 
		auto email = form.get("login-email", "");
		auto password = form.get("login-password", "");
		
		if(email != "" && password != "") {
			//auto session = sm->getSession(request);
			if(!mSession) {
				mSession = sm->getNewSession();		
				mSession->setLanguageCatalog(langCatalog);
				// get language
				// first check url, second check language header
				// for debugging client ip
				auto client_ip = request.clientAddress();
				std::string clientIpString = "client ip: ";
				clientIpString += client_ip.toString();
				Poco::Logger::get("requestLog").information(clientIpString);
				// debugging end
				auto user_host = request.clientAddress().host();
				mSession->setClientIp(user_host);
				response.addCookie(mSession->getLoginCookie());
			} else {
				langCatalog = mSession->getLanguageCatalog();
			}
			auto userState = mSession->loadUser(email, password);
			getErrors(mSession);
			
			auto uri_start = request.serverParams().getServerName();
			
			switch(userState) {
			case USER_EMPTY: 
			case USER_PASSWORD_INCORRECT:
				addError(new Error(langCatalog->gettext("Login"), langCatalog->gettext("E-Mail or password isn't right, please try again!")));
				break;
			case USER_EMAIL_NOT_ACTIVATED: 
				mSession->addError(new Error(langCatalog->gettext("Account"), langCatalog->gettext("E-Mail Address not checked, do you already get one?")));
				response.redirect(ServerConfig::g_serverPath +  "/checkEmail");
				return;
			case USER_NO_KEYS: 
				response.redirect(ServerConfig::g_serverPath + "/passphrase");
				return;
			case USER_NO_PRIVATE_KEY:
			case USER_COMPLETE:
				response.redirect(ServerConfig::g_php_serverPath + "/");
				return;
			}
			
		} else if(!langUpdatedByBtn) {
			addError(new Error(langCatalog->gettext("Login"), langCatalog->gettext("Username and password are needed!")));
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
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/loginServer/style.css\">\n";
	responseStream << "</head>\n";
	responseStream << "<body class=\"header-fixed\">\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 20 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<style type=\"text/css\">\n";
	responseStream << "@media (max-width: 400px) {\n";
	responseStream << "\t.authentication-theme.auth-style_1 .signup-link {\n";
	responseStream << "\t\tposition:relative;\n";
	responseStream << "\t}\n";
	responseStream << "\t.authentication-theme .signup-link {\n";
	responseStream << "\t\tisplay:initial;\n";
	responseStream << "\t}\n";
	responseStream << "}\t\n";
	responseStream << "</style>\n";
	responseStream << "<div class=\"authentication-theme auth-style_1\">\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-12 logo-section\">\n";
	responseStream << "          <a href=\"";
#line 121 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"logo\">\n";
	responseStream << "\t\t\t<picture>\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 123 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 124 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\"> \n";
	responseStream << "\t\t\t\t<img src=\"";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "\t\t\t</picture>\n";
	responseStream << "          </a>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-lg-5 col-md-7 col-sm-9 col-11 mx-auto\">\n";
	responseStream << "          <div class=\"grid\">\n";
	responseStream << "\t\t\t<div class=\"center-ul-container\">\n";
	responseStream << "\t\t\t\t";
#line 134 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\t  \n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "            <div class=\"grid-body\">\n";
	responseStream << "              <form action=\"";
#line 137 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/\" method=\"POST\">\n";
	responseStream << "\t\t\t  <input type=\"hidden\" name=\"lang\" value=\"";
#line 138 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( LanguageManager::keyForLanguage(lang) );
	responseStream << "\">\n";
	responseStream << "                <div class=\"row pull-right-row\">\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-england\" name=\"lang-btn\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 142 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 142 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 143 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-england\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-germany\" name=\"lang-btn\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 150 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 150 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 151 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-germany\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                </div>\n";
	responseStream << "                <div class=\"row display-block\">\n";
	responseStream << "                  <div class=\"col-lg-7 col-md-8 col-sm-9 col-12 mx-auto form-wrapper\">\n";
	responseStream << "                    <div class=\"form-group input-rounded\">\n";
	responseStream << "                      <input type=\"text\" class=\"form-control\" name=\"login-email\" placeholder=\"";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail") );
	responseStream << "\" value=\"";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( presetEmail );
	responseStream << "\"/>\n";
	responseStream << "                    </div>\n";
	responseStream << "                    <div class=\"form-group input-rounded\">\n";
	responseStream << "                      <input type=\"password\" class=\"form-control\" name=\"login-password\" placeholder=\"";
#line 163 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("Password") );
	responseStream << "\" />\n";
	responseStream << "                    </div>\n";
	responseStream << "                    <button type=\"submit\" name=\"submit\" class=\"btn btn-primary btn-block\">";
#line 165 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext(" Login ") );
	responseStream << "</button>\n";
	responseStream << "                    <div class=\"signup-link\">\n";
	responseStream << "                      <p>";
#line 167 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("You haven't any account yet? Please follow the link to create one.") );
	responseStream << "</p>\n";
	responseStream << "                      <a href=\"https://gradido.com\">";
#line 168 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( langCatalog->gettext("Create New Account") );
	responseStream << "</a>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                </div>\n";
	responseStream << "                </form>\n";
	responseStream << "            </div>\n";
	responseStream << "          </div>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"auth_footer\">\n";
	responseStream << "        <p class=\"text-muted text-center\">© Gradido 2019</p>\n";
	responseStream << "      </div>\n";
	responseStream << "    </div>\n";
	// begin include footer.cpsp
	responseStream << "\t<div class=\"grd-time-used dev-info\">\n";
	responseStream << "\t\t\t";
#line 2 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	// end include footer.cpsp
	if (_compressResponse) _gzipStream.close();
}
