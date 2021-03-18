#include "CheckEmailPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../SingletonManager/EmailManager.h"
enum PageState
{
	MAIL_NOT_SEND,
	ASK_VERIFICATION_CODE,
	EMAIL_ACTIVATED,
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
#line 19 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"

	const char* pageName = "Email Verification";
	auto lm = LanguageManager::getInstance();
	auto em = EmailManager::getInstance();

	auto lang = chooseLanguage(request);
	auto langCatalog = lm->getFreeCatalog(lang);
	unsigned long long verificationCode = 0;

	PageState state = ASK_VERIFICATION_CODE;

	if(mSession && model::table::EMAIL_OPT_IN_REGISTER_DIRECT == mSession->getEmailVerificationType())
	{
		state = EMAIL_ACTIVATED;
	}
	else
	{

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
	responseStream << "css/main.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "        <div class=\"center-form-single\">\n";
	responseStream << "            <div class=\"center-form-header\">\n";
	responseStream << "                <a href=\"";
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"center-logo\">\n";
	responseStream << "                    <picture>\n";
	responseStream << "                        <source srcset=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "                        <source srcset=\"";
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\">\n";
	responseStream << "                        <img src=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "                    </picture>\n";
	responseStream << "                </a>\n";
	responseStream << "            </div>";
	// end include header.cpsp
	responseStream << "\n";
#line 68 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "    ";
	// begin include flags.cpsp
	responseStream << "<div class=\"center-form-selectors\">\n";
	responseStream << "<form method=\"GET\" action=\"\">\n";
	responseStream << "\t<button id=\"flag-england\" name=\"lang\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"flag-btn\"";
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 4 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-england\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "\t<button id=\"flag-germany\" name=\"lang\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"flag-btn\"";
#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 8 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-germany\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "</form>\n";
	responseStream << "</div>";
	// end include flags.cpsp
	responseStream << "\n";
	responseStream << "    <div class=\"center-form-title\">\n";
	responseStream << "        <h1>";
#line 72 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail verifizieren") );
	responseStream << "</h1>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"center-form-form\">\n";
	responseStream << "      <form action=\"";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "account/checkEmail\" method=\"GET\">\n";
	responseStream << "\t";
#line 76 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(EMAIL_ACTIVATED == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Deine E-Mail wurde erfolgreich bestätigt. Du kannst nun Gradidos versenden.") );
	responseStream << "</p>\n";
	responseStream << "\t\t<a class=\"link-button\" href=\"";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Zur Startseite") );
	responseStream << "</a>\n";
	responseStream << "\t";
#line 79 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "        <label class=\"form-label\" for=\"email-verification-code\">";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Bitte gib deinen E-Mail Verification Code ein:"));
	responseStream << "</label>\n";
	responseStream << "        <input class=\"form-control\" type=\"number\" name=\"email-verification-code\" id=\"email-verification-code\" placeholder=\"";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Email Verification Code"));
	responseStream << "\" ";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 if(verificationCode) { 	responseStream << "value=\"";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( verificationCode );
	responseStream << "\" ";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << ">\n";
	responseStream << "        <button type=\"submit\" class=\"center-form-submit form-button\">";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("&Uuml;berpr&uuml;fe Code"));
	responseStream << "</button>\n";
	responseStream << "      </form>\n";
	responseStream << "  <!--<p>\n";
	responseStream << "\t";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Du hast bisher keinen Code erhalten?"));
	responseStream << "<br>\n";
	responseStream << "\t";
#line 86 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail erneut zuschicken (in Arbeit)"));
	responseStream << "\n";
	responseStream << "  </p>-->\n";
	responseStream << "      <p>\n";
	responseStream << "\t\t";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Funktioniert dein E-Mail Verification Code nicht?"));
	responseStream << "<br>\n";
	responseStream << "\t\t";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("Schicke uns eine E-Mail und wir k&uuml;mmern uns darum: "));
	responseStream << "<br>\n";
	responseStream << "        <b><a href=\"mailto:";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( em->getAdminReceiver());
	responseStream << "?subject=Invalid E-Mail Verification Code&amp;body=Hallo Dario,%0D%0A%0D%0Amein E-Mail Verification-Code: ";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( verificationCode );
	responseStream << " funktioniert nicht,%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail an Support schicken"));
	responseStream << "</a></b>\n";
	responseStream << "\t  </p>\n";
	responseStream << "    </form>\n";
	responseStream << "  ";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "            <div class=\"center-bottom\">\n";
	responseStream << "                <p>Copyright © Gradido 2020</p>\n";
	responseStream << "            </div>\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomleft\">\n";
	responseStream << "            ";
#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomright\">\n";
	responseStream << "            <p>Login Server in Entwicklung</p>\n";
	responseStream << "            <p>Alpha ";
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "        </div>\n";
	responseStream << "    </div>\n";
	responseStream << "</body>\n";
	responseStream << "\n";
	responseStream << "</html>";
	// end include footer.cpsp
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
