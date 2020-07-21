#include "RegisterDirectPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


void RegisterDirectPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"

	const char* pageName = "Registrieren";
	auto sm = SessionManager::getInstance();

	bool userReturned = false;

	if(!form.empty()) {
		if(form.get("register-password2", "") != form.get("register-password", "")) {
			addError(new Error("Passwort", "Passw&ouml;rter sind nicht identisch."), false);
		} else {
			auto session = sm->getSession(request);
			if(!session) {
				session = sm->getNewSession();
				auto user_host = request.clientAddress().host();
				session->setClientIp(user_host);
				response.addCookie(session->getLoginCookie());
			}

			userReturned = session->createUserDirect(
				form.get("register-first-name", ""),
				form.get("register-last-name", ""),
				form.get("register-email", ""),
				form.get("register-password", "")
			);

			getErrors(session);

			if(!errorCount()) {
				auto user_host = request.clientAddress().host();
				session->setClientIp(user_host);
				response.addCookie(session->getLoginCookie());
				response.redirect(ServerConfig::g_php_serverPath + "/");
				return;
			}
		}

	} else {
		// on enter login page with empty form
		// remove old cookies if exist
		sm->deleteLoginCookies(request, response);
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
#line 52 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<p>Bitte gib deine Daten um einen Account anzulegen:</p>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-first-name\">Vorname</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-first-name\" type=\"text\" name=\"register-first-name\" value=\"";
#line 61 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"
	responseStream << ( !form.empty() ? form.get("register-first-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-last-name\">Nachname</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-last-name\" type=\"text\" name=\"register-last-name\" value=\"";
#line 63 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"
	responseStream << ( !form.empty() ? form.get("register-last-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-email\">E-Mail</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-email\" type=\"email\" name=\"register-email\" value=\"";
#line 65 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerDirect.cpsp"
	responseStream << ( !form.empty() ? form.get("register-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"register-password\">Passwort Best&auml;tigung</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"register-password2\" type=\"password\" name=\"register-password2\"/>\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"Anmelden\">\n";
	responseStream << "\t</form>\n";
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
