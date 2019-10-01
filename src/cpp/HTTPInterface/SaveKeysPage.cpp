#include "SaveKeysPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"


#include "../model/Session.h"



SaveKeysPage::SaveKeysPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void SaveKeysPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 12 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"


	bool hasErrors = mSession->errorCount() > 0;
	bool hasPassword = mSession->getUser()->hasCryptoKey();
	
	if(!form.empty()) {
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
	responseStream << "<title>Gradido Login Server: Daten auf Server speichern?</title>\n";
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
	responseStream << "\t";
#line 40 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"
 if(hasErrors) {	responseStream << "\n";
	responseStream << "\t\t";
#line 41 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 42 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"
} 	responseStream << "\n";
	responseStream << "\t<h1>Daten speichern</h1>\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset>\n";
	responseStream << "\t\t\t<legend>Gradido Private Key speichern</legend>\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\t<p>M&ouml;chtest du deinen Gradido Private Key auf dem Server mit deinem Passwort verschl&uuml;sselt speichern?</p>\n";
	responseStream << "\t\t\t\t<p>Wenn du ihn speicherst brauchst du dich in Zukunft nur mit deiner E-Mail und deinem Passwort einzuloggen.</p>\n";
	responseStream << "\t\t\t\t<p>Wenn du ihn nicht speicherst, m&uuml;sstest du jedes mal wenn du eine Transaktion machen willst, deine Passphrase hier reinkopieren.</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"save-privkey-yes\" type=\"radio\" name=\"save-privkey\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"save-privkey-yes\">Ja, bitte speichern!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t";
#line 56 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"
 if(!hasPassword) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>Ich brauche nochmal dein Passwort wenn du dich für ja entscheidest.</p>\n";
	responseStream << "\t\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t\t<label for=\"login-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t\t<input id=\"save-privkey-password\" type=\"password\" name=\"save-privkey-password\"/>\n";
	responseStream << "\t\t\t\t</p>\n";
	responseStream << "\t\t\t";
#line 62 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\saveKeys.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"save-privkey-no\" type=\"radio\" name=\"save-privkey\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"save-privkey-no\">Nein, ich k&uuml;mmere mich selbst darum!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<fieldset>\n";
	responseStream << "\t\t\t<legend>Passphrase speichern</legend>\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\t<p>M&ouml;chtest du deine Passphrase mit dem Server-Admin-Key verschl&uuml;sselt auf dem Server gespeichert haben?</p>\n";
	responseStream << "\t\t\t\t<p>Dann kann dir der Server-Admin deine Passphrase zuschicken wenn du sie verlegt hast. </p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"save-passphrase-yes\" type=\"radio\" name=\"save-passphrase\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"save-passphrase-yes\">Ja, bitte speichern!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"save-passphrase-no\" type=\"radio\" name=\"save-passphrase\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"save-passphrase-no\">Nein, ich vertraue nur mir selbst!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Speichern\">\n";
	responseStream << "\t</form>\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
