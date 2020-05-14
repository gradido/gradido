#include "CheckEmailPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"

enum PageState 
{
	MAIL_NOT_SEND,
	ASK_VERIFICATION_CODE,
	KONTO_ALREADY_EXIST
};
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


CheckEmailPage::CheckEmailPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void CheckEmailPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 18 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"

	const char* pageName = "Email Verification";
	auto lm = LanguageManager::getInstance();
	
	auto lang = chooseLanguage(request);
	auto langCatalog = lm->getFreeCatalog(lang);
	unsigned long long verificationCode = 0;
	
	if(!form.empty()) {
		auto langBtn = form.get("lang-btn", "");
		auto verficationCodeStr = form.get("email-verification-code", "0");
		try {
			verificationCode = stoull(verficationCodeStr);
		} catch(...) {
			verificationCode = 0;
		}
		auto updatedLang = LANG_NULL;
		if(langBtn != "") {
			lang = chooseLanguage(request, langBtn);
			langCatalog = lm->getFreeCatalog(lang);
		}
	}
	
	// remove old cookies if exist
	auto sm = SessionManager::getInstance();
	sm->deleteLoginCookies(request, response, mSession);
	PageState state = ASK_VERIFICATION_CODE;
	if(mSession) {
		getErrors(mSession);
		if(mSession->getSessionState() < SESSION_STATE_EMAIL_VERIFICATION_SEND) {
			//state = MAIL_NOT_SEND;
		}
	}
	auto hasErrors = errorCount() > 0;
	if(!verificationCode) {
		verificationCode = getLastGetAsU64(request.getURI());
	}

#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 
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
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/loginServer/style.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body class=\"header-fixed\">\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 20 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"authentication-theme auth-style_1\">\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-12 logo-section\">\n";
	responseStream << "          <a href=\"";
#line 60 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"logo\">\n";
	responseStream << "            <picture>\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 62 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 63 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\"> \n";
	responseStream << "\t\t\t\t<img src=\"";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "\t\t\t</picture>\n";
	responseStream << "          </a>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-lg-5 col-md-7 col-sm-9 col-11 mx-auto\">\n";
	responseStream << "          <div class=\"grid\">\n";
	responseStream << "            <div class=\"center-ul-container\">\n";
	responseStream << "              ";
#line 73 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"grid-body\">\n";
	responseStream << "              <form action=\"";
#line 76 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "account/checkEmail\" method=\"GET\">\n";
	responseStream << "                <div class=\"row pull-right-row\">\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-england\" name=\"lang-btn\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-england\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-germany\" name=\"lang-btn\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 88 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 88 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-germany\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                </div>\n";
	responseStream << "                <div class=\"item-wrapper\">\n";
	responseStream << "                        <div class=\"form-group\">\n";
	responseStream << "                          <label for=\"email-verification-code\">";
#line 97 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Bitte gebe deinen E-Mail Verification Code ein:"));
	responseStream << "</label>\n";
	responseStream << "                          <input type=\"number\" class=\"form-control\" name=\"email-verification-code\" id=\"email-verification-code\" placeholder=\"";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Email Verification Code"));
	responseStream << "\" ";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(verificationCode) { 	responseStream << "value=\"";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( verificationCode );
	responseStream << "\" ";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                        </div>\n";
	responseStream << "                        <button type=\"submit\" class=\"btn btn-sm btn-primary\">";
#line 100 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("&Uuml;berpr&uuml;fe Code"));
	responseStream << "</button>\n";
	responseStream << "                </div>\n";
	responseStream << "                </form>\n";
	responseStream << "              <!--<p class=\"margin-top-10\">\n";
	responseStream << "\t\t\t\t";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Du hast bisher keinen Code erhalten?"));
	responseStream << "<br> \n";
	responseStream << "\t\t\t\t";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail erneut zuschicken (in Arbeit)"));
	responseStream << "\n";
	responseStream << "\t\t\t  </p>-->\n";
	responseStream << "              <p class=\"margin-top-10\">\n";
	responseStream << "\t\t\t\t";
#line 108 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Funktioniert dein E-Mail Verification Code nicht?"));
	responseStream << "<br>\n";
	responseStream << "\t\t\t\t";
#line 109 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Schicke uns eine E-Mail und wir k&uuml;mmern uns darum: "));
	responseStream << "<br>\n";
	responseStream << "                <b><a href=\"mailto:coin@gradido.net?subject=Invalid E-Mail Verification Code&amp;body=Hallo Dario,%0D%0A%0D%0Amein E-Mail Verification-Code: ";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( verificationCode );
	responseStream << " funktioniert nicht,%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail an Support schicken"));
	responseStream << "</a></b>\n";
	responseStream << "\t\t\t  </p>\n";
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
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
