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
	ASK_VERIFICATION_CODE
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
#line 17 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"

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
	responseStream << "<body>\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha 0.8.1</p>\n";
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
	responseStream << "<div class=\"authentication-theme auth-style_1\">\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-12 logo-section\">\n";
	responseStream << "          <a href=\"../../index.html\" class=\"logo\">\n";
	responseStream << "            <img src=\"";
#line 60 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" alt=\"logo\" />\n";
	responseStream << "          </a>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-lg-5 col-md-7 col-sm-9 col-11 mx-auto\">\n";
	responseStream << "          <div class=\"grid\">\n";
	responseStream << "            <div class=\"center-ul-container\">\n";
	responseStream << "              ";
#line 68 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"grid-body\">\n";
	responseStream << "              <form action=\"";
#line 71 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "account/checkEmail\" method=\"GET\">\n";
	responseStream << "                <div class=\"row pull-right-row\">\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-england\" name=\"lang-btn\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 76 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-england\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                  <div class=\"equel-grid pull-right\">\n";
	responseStream << "                    <div class=\"grid-body-small text-center\">\n";
	responseStream << "                        <button id=\"flag-germany\" name=\"lang-btn\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 83 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 83 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 
						else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                          <span class=\"flag-germany\"></span>\n";
	responseStream << "                        </button>\n";
	responseStream << "                    </div>\n";
	responseStream << "                  </div>\n";
	responseStream << "                </div>\n";
	responseStream << "                <div class=\"item-wrapper\">\n";
	responseStream << "                        <div class=\"form-group\">\n";
	responseStream << "                          <label for=\"email-verification-code\">";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Bitte gebe deinen E-Mail Verification Code ein:"));
	responseStream << "</label>\n";
	responseStream << "                          <input type=\"text\" class=\"form-control\" name=\"email-verification-code\" id=\"email-verification-code\" placeholder=\"";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Email Verification Code"));
	responseStream << "\" ";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(verificationCode) { 	responseStream << "value=\"";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( verificationCode );
	responseStream << "\" ";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "                        </div>\n";
	responseStream << "                        <button type=\"submit\" class=\"btn btn-sm btn-primary\">";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("&Uuml;berpr&uuml;fe Code"));
	responseStream << "</button>\n";
	responseStream << "                </div>\n";
	responseStream << "                </form>\n";
	responseStream << "              <!--<p class=\"margin-top-10\">\n";
	responseStream << "\t\t\t\t";
#line 99 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Du hast bisher keinen Code erhalten?"));
	responseStream << "<br> \n";
	responseStream << "\t\t\t\t";
#line 100 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail erneut zuschicken (in Arbeit)"));
	responseStream << "\n";
	responseStream << "\t\t\t  </p>-->\n";
	responseStream << "              <p class=\"margin-top-10\">\n";
	responseStream << "\t\t\t\t";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Funktioniert dein E-Mail Verification Code nicht?"));
	responseStream << "<br>\n";
	responseStream << "\t\t\t\t";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Schicke mir eine E-Mail und ich k&uuml;mmere mich darum: "));
	responseStream << "<br>\n";
	responseStream << "                <a href=\"mailto:coin@gradido.net?subject=Invalid E-Mail Verification Code&amp;body=Hallo Dario,%0D%0A%0D%0Amein E-Mail Verification-Code: 121121354 funktioniert nicht,%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">E-Mail</a>\n";
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
