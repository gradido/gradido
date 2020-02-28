#include "UpdateUserPasswordPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"

enum PageState {
	PAGE_STATE_ASK_PASSWORD,
	PAGE_STATE_SUCCEED
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
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
#line 16 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"

	const char* pageName = "Passwort bestimmen";
	auto user = mSession->getUser();
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
				
				
				if(user->updatePassword(pwd, mSession->getPassphrase(), mSession->getNewUser())) {
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
					mSession->getErrors(user);
					if(-2 == retUpdateEmailCode || -1 == retUpdateEmailCode || 1 == retUpdateEmailCode) {
						response.redirect(uri_start + "/error500");
						return;
					}
					if(sessionState == SESSION_STATE_RESET_PASSWORD_REQUEST) {
						state = PAGE_STATE_SUCCEED;
						mSession->updateState(SESSION_STATE_RESET_PASSWORD_SUCCEED);
					} else {
						response.redirect(uri_start + "/passphrase");
						return;
					}
				}
			}
		}
	}
	getErrors(mSession);
	getErrors(user);
	printf("session state end [UpdateUserPassword Page]: %s\n", mSession->getSessionStateString());
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_old.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/css/styles.css\">\n";
	responseStream << "<style type=\"text/css\" >\n";
	responseStream << ".grd_container\n";
	responseStream << "{\n";
	responseStream << "  max-width:820px;\n";
	responseStream << "  margin-left:auto;\n";
	responseStream << "  margin-right:auto;\n";
	responseStream << "}\n";
	responseStream << "\n";
	responseStream << "input:not([type='radio']) {\n";
	responseStream << "\twidth:200px;\n";
	responseStream << "}\n";
	responseStream << "label:not(.grd_radio_label) {\n";
	responseStream << "\twidth:80px;\n";
	responseStream << "\tdisplay:inline-block;\n";
	responseStream << "}\n";
	responseStream << ".grd_container_small\n";
	responseStream << "{\n";
	responseStream << "  max-width:500px;\n";
	responseStream << "}\n";
	responseStream << ".grd_text {\n";
	responseStream << "  max-width:550px;\n";
	responseStream << "  margin-bottom: 5px;\n";
	responseStream << "}\n";
	responseStream << ".dev-info {\n";
	responseStream << "\tposition: fixed;\n";
	responseStream << "\tcolor:grey;\n";
	responseStream << "\tfont-size: smaller;\n";
	responseStream << "\tleft:8px;\n";
	responseStream << "}\n";
	responseStream << ".grd-time-used {  \n";
	responseStream << "  bottom:0;\n";
	responseStream << "} \n";
	responseStream << "\n";
	responseStream << ".versionstring {\n";
	responseStream << "\ttop:0;\n";
	responseStream << "}\n";
	responseStream << "</style>\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 53 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	// end include header_old.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t";
#line 72 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 if(PAGE_STATE_ASK_PASSWORD == state ) { 	responseStream << "\n";
	responseStream << "\t<h1>Passwort bestimmen</h1>\n";
	responseStream << "\t";
#line 74 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\t\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tBitte denke dir ein sicheres Passwort aus, das mindestens 8 Zeichen lang ist, ein Klein- und einen Gro&szlig;buchstaben enth&auml;lt,\n";
	responseStream << "\t\t\t\teine Zahl und eines der folgenden Sonderzeichen: @$!%*?&+-\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password2\">Passwort Best&auml;tigung</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password2\" type=\"password\" name=\"register-password2\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"submit\" value=\"&Auml;nderung(en) speichern\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 } else if(PAGE_STATE_SUCCEED == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>Deine Daten werden jetzt mit dem neuen Passwort verschl&uuml;sselt. Du kannst dich in etwa 1 Minute mit deinem neuen Passwort einloggen</p>\n";
	responseStream << "\t\t<a href=\"";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
	responseStream << ( uri_start );
	responseStream << "/login\" class=\"grd-form-bn grd-form-bn-succeed\">Zum Login</a>\n";
	responseStream << "\t";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\UpdateUserPassword.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
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
