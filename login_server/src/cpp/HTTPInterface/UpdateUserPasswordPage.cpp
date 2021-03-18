#include "UpdateUserPasswordPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"
#include "Poco/Net/HTTPCookie.h"

enum PageState {
	PAGE_STATE_ASK_PASSWORD,
	PAGE_STATE_SUCCEED
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


UpdateUserPasswordPage::UpdateUserPasswordPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void UpdateUserPasswordPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 17 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"

	const char* pageName = "Passwort bestimmen";
	auto user = mSession->getNewUser();
	auto sm = SessionManager::getInstance();
	auto uri_start = ServerConfig::g_serverPath;
	PageState state = PAGE_STATE_ASK_PASSWORD;

	// remove old cookies if exist
	sm->deleteLoginCookies(request, response, mSession);
	// save login cookie, because maybe we've get an new session
	response.addCookie(mSession->getLoginCookie());

	if(!form.empty()) {
		auto pwd = form.get("register-password", "");
		if(pwd != "") {
			if(pwd != form.get("register-password2", "")) {
				mSession->addError(new Error("Passwort", "Passw&ouml;rter sind nicht identisch."), false);
			} else if(SessionManager::getInstance()->checkPwdValidation(pwd, mSession)) {
			    auto sessionState = mSession->getSessionState();

				if(user->setNewPassword(pwd) >= 0) {
					//std::string referUri = request.get("Referer", uri_start + "/");
					//printf("[updateUserPasswordPage] redirect to referUri: %s\n", referUri.data());

					// I think we can savly assume that this session was loaded from verification code
					//! \return 1 = konto already activated
					//!        -1 = invalid code
					//!        -2 = critical error
					//!         0 = ok
					auto code = mSession->getEmailVerificationCode();
					int retUpdateEmailCode = 0;
					if(code) {
						retUpdateEmailCode = mSession->updateEmailVerification(mSession->getEmailVerificationCode());
					}
					//mSession->getErrors(user);
					if(-2 == retUpdateEmailCode || -1 == retUpdateEmailCode || 1 == retUpdateEmailCode) {
						response.redirect(uri_start + "/error500");
						return;
					}
					if(sessionState == SESSION_STATE_RESET_PASSWORD_REQUEST) {
						state = PAGE_STATE_SUCCEED;
						mSession->updateState(SESSION_STATE_RESET_PASSWORD_SUCCEED);
						sm->deleteLoginCookies(request, response, mSession);
						sm->releaseSession(mSession);
						mSession = nullptr;
					} else {
						response.redirect(uri_start + "/passphrase");
						return;
					}
				}
			}
		}
	}
	if(mSession) {
		getErrors(mSession);
	}
	//getErrors(user);
	//printf("session state end [UpdateUserPassword Page]: %s\n", mSession->getSessionStateString());
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
#line 76 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 if(PAGE_STATE_ASK_PASSWORD == state ) { 	responseStream << "\n";
	responseStream << "    <div class=\"center-form-title\">\n";
	responseStream << "        <h1>Passwort bestimmen</h1>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<p>\n";
	responseStream << "\t\t\t\tBitte denke dir ein sicheres Passwort aus, das mindestens 8 Zeichen lang ist, einen Klein- und einen Gro&szlig;buchstaben enth&auml;lt,\n";
	responseStream << "\t\t\t\teine Zahl und eines der folgenden Sonderzeichen: @$!%*?&+-\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-password2\">Passwort Best&auml;tigung</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-password2\" type=\"password\" name=\"register-password2\"/>\n";
	responseStream << "\t\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"submit\" value=\"&Auml;nderung(en) speichern\">\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 } else if(PAGE_STATE_SUCCEED == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>Deine Daten werden jetzt mit dem neuen Passwort verschl&uuml;sselt. Du kannst dich in etwa 1 Minute mit deinem neuen Passwort einloggen</p>\n";
	responseStream << "\t\t<a class=\"link-button\" href=\"";
#line 96 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
	responseStream << ( uri_start );
	responseStream << "/login\">Zum Login</a>\n";
	responseStream << "\t";
#line 97 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</div>\n";
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
