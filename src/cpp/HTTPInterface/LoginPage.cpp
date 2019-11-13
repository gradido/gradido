#include "LoginPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 
#include "../gettext.h"

#include "Poco/Net/HTTPCookie.h"
#include "Poco/Net/HTTPServerParams.h"
#include "Poco/Logger.h"
#include "../SingletonManager/SessionManager.h"
	
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


void LoginPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
 
	const char* pageName = "Login";
	auto sm = SessionManager::getInstance();
	
	if(!form.empty()) {
		auto email = form.get("login-email", "");
		auto password = form.get("login-password", "");
		
		if(email != "" && password != "") {
			auto session = sm->getSession(request);
			if(!session) {
				session = sm->getNewSession();		
				
				// for debugging client ip
				auto client_ip = request.clientAddress();
				std::string clientIpString = "client ip: ";
				clientIpString += client_ip.toString();
				Poco::Logger::get("requestLog").information(clientIpString);
				// debugging end
				auto user_host = request.clientAddress().host();
				session->setClientIp(user_host);
				response.addCookie(session->getLoginCookie());
			}
			auto userState = session->loadUser(email, password);
			getErrors(session);
			
			auto uri_start = request.serverParams().getServerName();
			
			switch(userState) {
			case USER_EMPTY: 
			case USER_PASSWORD_INCORRECT:
				addError(new Error(gettext("Login"), gettext("E-Mail or password isn't right, please try again!")));
				break;
			case USER_EMAIL_NOT_ACTIVATED: 
				session->addError(new Error(gettext("Account"), gettext("E-Mail Address not checked, do you already get one?")));
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
			
		} else {
			addError(new Error(gettext("Login"), gettext("Username and password are needed!")));
		}
		
	} else {
		// on enter login page with empty form
		// remove old cookies if exist
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
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
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
	responseStream << "\t<p class=\"grd_small\">Alpha 0.5.1</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 58 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<form method=\"POST\">\n";
	responseStream << "\t<div class=\"grd_container\">\n";
	responseStream << "\t\t<h1>Login</h1>\n";
	responseStream << "\t\t";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Login</legend>\n";
	responseStream << "\t\t\t<p>";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( gettext("Please give you email and password for login.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"login-email\">";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( gettext("E-Mail") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t<input id=\"login-email\" type=\"text\" name=\"login-email\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"login-password\">";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( gettext("Password") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t<input id=\"login-password\" type=\"password\" name=\"login-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"submit\" value=\"Einloggen\">\n";
	responseStream << "\t\t<p>";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( gettext("You haven't any account yet? Please follow the link to create one.") );
	responseStream << "</p>\n";
	responseStream << "\t\t<a href=\"https://gradido.com\">";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login.cpsp"
	responseStream << ( gettext("Create New Account") );
	responseStream << "</a>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t\n";
	responseStream << "</form>\n";
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
