#include "PassphrasePage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"

#include "../SingletonManager/SessionManager.h"
//#include "Poco/Net/HTTPServerParams.h"

enum PageState 
{
	PAGE_ASK_PASSPHRASE,
	PAGE_SHOW_PASSPHRASE
};
#line 1 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


PassphrasePage::PassphrasePage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void PassphrasePage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 17 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"

	const char* pageName = "Passphrase";
	PageState state = PAGE_ASK_PASSPHRASE;
	
	auto sm = SessionManager::getInstance();
	auto uri_start = ServerConfig::g_serverPath;//request.serverParams().getServerName();
	// remove old cookies if exist
	sm->deleteLoginCookies(request, response, mSession);
	// save login cookie, because maybe we've get an new session
	response.addCookie(mSession->getLoginCookie());
	
	if (!form.empty()) {
		auto registerKeyChoice = form.get("passphrase", "");
		std::string oldPassphrase = "";
		if (registerKeyChoice == "no") {
			auto oldPassphrase = form.get("passphrase-existing", "");

			if (oldPassphrase != "" && User::validatePassphrase(oldPassphrase)) {
				// passphrase is valid 
				mSession->setPassphrase(oldPassphrase);
				mSession->updateState(SESSION_STATE_PASSPHRASE_SHOWN);
				state = PAGE_SHOW_PASSPHRASE;
			}
			else {
				addError(new Error("Passphrase", "Diese Passphrase ist ung&uuml;ltig, bitte &uuml;berpr&uuml;fen oder neu generieren (lassen)."));
			}
		}
		else if (registerKeyChoice == "yes") {
			mSession->generatePassphrase();
		}
	}

	if(mSession->getSessionState() == SESSION_STATE_PASSPHRASE_GENERATED) {
		state = PAGE_SHOW_PASSPHRASE;
		mSession->updateState(SESSION_STATE_PASSPHRASE_SHOWN);
	}
	getErrors(mSession);
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
#line 9 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
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
	responseStream << "\t<p class=\"grd_small\">Alpha 0.4.4</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 58 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 57 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 58 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 if(state == PAGE_SHOW_PASSPHRASE) {	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tSchreibe dir die Passphrase auf und packe sie gut weg. Du brauchst sie um deine Adresse wiederherzustellen. Wenn du ihn verlierst, sind auch deine Gradidos verloren.\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"grd_textarea\">\n";
	responseStream << "\t\t\t\t";
#line 64 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( mSession->getPassphrase() );
	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"grd-margin-top-10\"></div>\n";
	responseStream << "\t\t\t<a href=\"saveKeys\" class=\"grd-form-bn grd-form-bn-succeed grd_clickable\">Weiter</a>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 69 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } else if(state == PAGE_ASK_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t<p>Deine E-Mail Adresse wurde erfolgreich bestätigt. </p>\n";
	responseStream << "\t<form method=\"POST\" action=\"";
#line 71 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/passphrase\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Neue Gradido Adresse anlegen / wiederherstellen</legend>\n";
	responseStream << "\t\t\t<p>Hast du schonmal ein Gradido Konto besessen?</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"passphrase-new-yes\" type=\"radio\" name=\"passphrase\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"passphrase-new-yes\">Nein, bitte ein neues erstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"passphrase-new-no\" type=\"radio\" name=\"passphrase\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"passphrase-new-no\">Ja, bitte wiederherstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"passphrase-existing\">";
#line 83 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase-existing", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"submit\" value=\"Weiter\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 89 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\tUngültige Seite, wenn du das siehst stimmt hier etwas nicht. Bitte wende dich an den Server-Admin. \n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 93 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "\t<div class=\"grd-time-used dev-info\">\n";
	responseStream << "\t\t\t";
#line 2 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	// end include footer.cpsp
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
