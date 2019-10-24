#include "LoginPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
 
#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"
#include "Poco/Net/HTTPServerParams.h"
#include "../model/Profiler.h"
#include "../ServerConfig.h"	
	


void LoginPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 14 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
 
	
	auto sm = SessionManager::getInstance();
	
	if(!form.empty()) {
		auto email = form.get("login-email", "");
		auto password = form.get("login-password", "");
		
		if(email != "" && password != "") {
			auto session = sm->getSession(request);
			if(!session) {
				session = sm->getNewSession();		
				auto user_host = request.clientAddress().host();
				auto client_ip = request.clientAddress();
				printf("client ip: %s\n", client_ip.toString().data());
				session->setClientIp(user_host);
				response.addCookie(session->getLoginCookie());
			}
			auto userState = session->loadUser(email, password);
			getErrors(session);
			
			auto uri_start = request.serverParams().getServerName();
			
			switch(userState) {
			case USER_EMPTY: 
			case USER_PASSWORD_INCORRECT:
				addError(new Error("Login", "E-Mail oder Passwort nicht korrekt, bitte versuche es erneut!"));
				break;
			case USER_EMAIL_NOT_ACTIVATED: 
				session->addError(new Error("Account", "E-Mail Adresse wurde noch nicht best&auml;tigt, hast du schon eine E-Mail erhalten?"));
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
			addError(new Error("Login", "Benutzernamen und Passwort m&uuml;ssen angegeben werden!"));
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
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: Login</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"https://gradido2.dario-rekowski.de/css/styles.css\">\n";
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
	responseStream << "</style>\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "<form method=\"POST\">\n";
	responseStream << "\t<div class=\"grd_container\">\n";
	responseStream << "\t\t<h1>Login</h1>\n";
	responseStream << "\t\t";
#line 93 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Login</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe deine Zugangsdaten ein um dich einzuloggen.</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"login-email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"login-email\" type=\"text\" name=\"login-email\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"login-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"login-password\" type=\"password\" name=\"login-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Einloggen\">\n";
	responseStream << "\t\t<p>Du hast noch keinen Account? Dann folge dem Link um dir einen anzulegen</p>\n";
	responseStream << "\t\t<a href=\"register\">Neuen Account anlegen</a>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"grd-time-used\">\n";
	responseStream << "\t\t";
#line 112 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</form>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	if (_compressResponse) _gzipStream.close();
}
