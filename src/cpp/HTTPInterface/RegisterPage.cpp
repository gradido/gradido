#include "RegisterPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 4 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"

#include "../SingletonManager/SessionManager.h"


void RegisterPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"

	auto session = SessionManager::getInstance()->getNewSession();
	bool userReturned = false;
	if(!form.empty()) {
		userReturned = session->createUser(
			form.get("register-name"),
			form.get("register-email"),
			form.get("register-password"),
			form.get("register-key-existing")
		);
	}
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
	responseStream << "<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\n";
	responseStream << "<form method=\"POST\">\n";
	responseStream << "\t<div class=\"grd_container\">\n";
	responseStream << "\t";
#line 42 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
 if(!form.empty() && !userReturned) {	responseStream << "\n";
	responseStream << "\t\t";
#line 43 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( session->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 44 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
} 	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Account anlegen</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe deine Daten um einen Account anzulegen</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-name\">Vorname</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-name\" type=\"text\" name=\"register-name\" value=\"";
#line 50 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-email\" type=\"email\" name=\"register-email\" value=\"";
#line 54 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p>Hast du bereits schonmal ein Gradido Konto besessen?</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"register-key-new-yes\" type=\"radio\" name=\"register-key\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"register-key-new-yes\">Nein, bitte ein neues erstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"register-key-new-no\" type=\"radio\" name=\"register-key\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"register-key-new-no\">Ja, bitte wiederherstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"register-key-existing\">";
#line 69 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-key-existing") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Einloggen\">\n";
	responseStream << "\t</div>\n";
	responseStream << "</form>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
