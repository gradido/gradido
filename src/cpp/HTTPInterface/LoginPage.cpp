#include "LoginPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 4 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
 
#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"
#include "Poco/Net/HTTPServerParams.h"
	


void LoginPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 10 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
 
	auto session = SessionManager::getInstance()->getNewSession();
	
	if(!form.empty()) {
		auto email = form.get("login-email", "");
		auto password = form.get("login-password", "");
		if(session->loadUser(email, password)) {
			auto user_host = request.clientAddress().host();
			session->setClientIp(user_host);
			response.addCookie(session->getLoginCookie());
			auto uri_start = request.serverParams().getServerName();
			response.redirect(uri_start + "/");
			return;
		}
	} else {
		// remove old cookies if exist
		auto keks = Poco::Net::HTTPCookie("GRADIDO_LOGIN", "");
		// max age of 0 delete cookie
		keks.setMaxAge(0);
		response.addCookie(keks);
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
#line 62 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\login.cpsp"
	responseStream << ( session->getErrorsHtml() );
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
	responseStream << "\t\t<a href=\"/register\">Neuen Account anlegen</a>\n";
	responseStream << "\t</div>\n";
	responseStream << "</form>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
