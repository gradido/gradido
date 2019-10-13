#include "PassphrasePage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"

#include "../model/Profiler.h"

enum PageState 
{
	PAGE_ASK_PASSPHRASE,
	PAGE_SHOW_PASSPHRASE
};


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
#line 16 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"

	Profiler timeUsed;
	PageState state = PAGE_ASK_PASSPHRASE;
	bool hasErrors = mSession->errorCount() > 0;
	
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
				mSession->addError(new Error("Merkspruch", "Dieser Merkspruch ist ung&uuml;ltig, bitte &uuml;berpr&uuml;fen oder neu generieren (lassen)."));
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
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: Passphrase</title>\n";
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
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t";
#line 77 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 if(mSession && hasErrors) {	responseStream << "\n";
	responseStream << "\t\t";
#line 78 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 79 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
} 	responseStream << "\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 81 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 if(state == PAGE_SHOW_PASSPHRASE) {	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tSchreibe dir die Passphrase auf und packe sie gut weg. Du brauchst sie um deine Adresse wiederherzustellen. Wenn du ihn verlierst, sind auch deine Gradidos verloren.\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"grd_textarea\">\n";
	responseStream << "\t\t\t\t";
#line 87 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( mSession->getPassphrase() );
	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<a href=\"saveKeys\">Weiter</a>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 91 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } else if(state == PAGE_ASK_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t<p>Deine E-Mail Adresse wurde erfolgreich bestätigt. </p>\n";
	responseStream << "\t<form method=\"POST\" action=\"passphrase\">\n";
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
#line 105 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase-existing", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Weiter\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 110 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\tUngültige Seite, wenn du das siehst stimmt hier etwas nicht. Bitte wende dich an den Server-Admin. \n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 114 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"grd-time-used\">\n";
	responseStream << "\t";
#line 117 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( timeUsed.string() );
	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
