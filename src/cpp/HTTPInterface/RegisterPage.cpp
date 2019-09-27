#include "RegisterPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 4 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"


void RegisterPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 8 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"

	auto session = SessionManager::getInstance()->getNewSession();
	bool userReturned = false;
	if(!form.empty()) {
		userReturned = session->createUser(
			form.get("register-name"),
			form.get("register-email"),
			form.get("register-password")
		);
		if(userReturned) {
			auto cookie_id = session->getHandle();
			//auto user_host_string = request.clientAddress().toString();
			auto user_host = request.clientAddress().host();
			session->setClientIp(user_host);
			//printf("cookie: %d, user_host: %s\n", cookie_id, user_host.data());
			response.addCookie(Poco::Net::HTTPCookie("user", std::to_string(cookie_id)));
		}
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
	responseStream << "<title>Gradido Login Server: Register</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"https://gradido2.dario-rekowski.de/css/styles.css\">\n";
	responseStream << "<style type=\"text/css\" >\n";
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
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 48 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
 if(!form.empty() && userReturned) {	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tSchreibe dir den Merkspruch auf und packe ihn gut weg. Du brauchst ihn um deine Adresse wiederherzustellen. Wenn du ihn verlierst, sind auch deine Gradidos verloren.\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"grd_textarea\">\n";
	responseStream << "\t\t\t\t";
#line 54 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( session->getPassphrase() );
	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 57 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\n";
	responseStream << "\t\t";
#line 60 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
 if(!form.empty() && !userReturned) {	responseStream << "\n";
	responseStream << "\t\t\t";
#line 61 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( session->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t\t";
#line 62 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
} 	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Account anlegen</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe deine Daten um einen Account anzulegen</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-name\">Vorname</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-name\" type=\"text\" name=\"register-name\" value=\"";
#line 68 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-email\" type=\"email\" name=\"register-email\" value=\"";
#line 72 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Anmelden\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 82 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
