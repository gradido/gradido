#include "CheckEmailPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../model/User.h"
#include "Poco/Net/HTTPCookie.h"

enum PageState 
{
	PAGE_VERIFICATION_FAILED,
	PAGE_ASK_PASSPHRASE,
	PAGE_SHOW_PASSPHRASE,
	PAGE_ASK_VERIFICATION_CODE
};


CheckEmailPage::CheckEmailPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void CheckEmailPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 20 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"

	auto sm = SessionManager::getInstance();
	bool hasErrors = false;
	unsigned long long verificationCode = 0;
	PageState state = PAGE_ASK_PASSPHRASE;
	std::string uri = request.getURI();
	//printf("uri: %s\n", uri.data());
	
	if(!form.empty()) {
	  try {
		verificationCode = stoll(form.get("email-verification-code", "0"));
	  } catch(...) {}
	}
	if(!verificationCode) {
		size_t pos = uri.find_last_of("/");
		try {
			verificationCode = stoll(uri.substr(pos+1));
		} catch(...) {}
	}
	if(!verificationCode) {
		state = PAGE_ASK_VERIFICATION_CODE;
	} else {
		// no session
		if(!mSession || mSession->getEmailVerificationCode() != verificationCode) {
			mSession = sm->findByEmailVerificationCode(verificationCode);
		}
		// no session in server, load from db
		if(!mSession) {
			mSession = sm->getNewSession();
			if(mSession->loadFromEmailVerificationCode(verificationCode)) {
				auto cookie_id = mSession->getHandle();
				auto user_host = request.clientAddress().host();
				mSession->setClientIp(user_host);
				response.addCookie(Poco::Net::HTTPCookie("user", std::to_string(cookie_id)));
			} else {
				sm->releseSession(mSession);
				mSession = nullptr;
				state = PAGE_VERIFICATION_FAILED;
			}
		}
		if(mSession) {
			mSession->updateEmailVerification(verificationCode);
			hasErrors = mSession->errorCount() > 0;
			
			if(!hasErrors && !form.empty()) {
				auto registerKeyChoice = form.get("register-key", "");
				std::string oldPassphrase = "";
				if(registerKeyChoice == "no") {
					auto oldPassphrase = form.get("register-key-existing", "");
					
					if(oldPassphrase != "" && User::validatePassphrase(oldPassphrase)) {
						// passphrase is valid 
						mSession->setPassphrase(oldPassphrase);
						mSession->updateState(SESSION_STATE_PASSPHRASE_SHOWN);
						state = PAGE_SHOW_PASSPHRASE;
					} else {
						mSession->addError(new Error("Merkspruch", "Dieser Merkspruch ist ung&uuml;ltig, bitte &uuml;berpr&uuml;fen oder neu generieren (lassen)."));
					}
				} else if(registerKeyChoice == "yes") {
					mSession->generatePassphrase();
					state = PAGE_SHOW_PASSPHRASE;
				}
			}
		} else {
			state = PAGE_VERIFICATION_FAILED;
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
	responseStream << "<title>Gradido Login Server: Email OptIn</title>\n";
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
#line 108 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(mSession && hasErrors) {	responseStream << "\n";
	responseStream << "\t\t";
#line 109 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 110 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
} 	responseStream << "\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 112 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(state == PAGE_SHOW_PASSPHRASE) {	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tSchreibe dir den Merkspruch auf und packe ihn gut weg. Du brauchst ihn um deine Adresse wiederherzustellen. Wenn du ihn verlierst, sind auch deine Gradidos verloren.\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"grd_textarea\">\n";
	responseStream << "\t\t\t\t";
#line 118 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( mSession->getPassphrase() );
	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<a href=\"/saveKeys\">Weiter</a>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 122 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else if(state == PAGE_ASK_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Account anlegen</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe deine Daten um einen Account anzulegen</p>\n";
	responseStream << "\t\t\t<p>Hast du schonmal ein Gradido Konto besessen?</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"register-key-new-yes\" type=\"radio\" name=\"register-key\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"register-key-new-yes\">Nein, bitte ein neues erstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"register-key-new-no\" type=\"radio\" name=\"register-key\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label class=\"grd_radio_label\" for=\"register-key-new-no\">Ja, bitte wiederherstellen!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"register-key-existing\">";
#line 136 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( !form.empty() ? form.get("register-key-existing", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Weiter\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 141 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else if(state == PAGE_ASK_VERIFICATION_CODE) { 	responseStream << "\n";
	responseStream << "\t<form method=\"GET\">\n";
	responseStream << "\t\t<p>Bitte gebe deinen E-Mail Verification Code ein. </p>\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Überprüfe Code\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 147 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else if(state == PAGE_VERIFICATION_FAILED) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 148 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(mSession) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 149 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(mSession->getSessionState() == SESSION_STATE_EMAIL_VERIFICATION_SEND) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>Bitte versuche es erneut</p>\n";
	responseStream << "\t\t\t\t<form method=\"GET\" action=\"/checkEmail\">\n";
	responseStream << "\t\t\t\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t\t\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Überprüfe Code\">\n";
	responseStream << "\t\t\t\t</form>\n";
	responseStream << "\t\t\t";
#line 155 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else if(mSession->getSessionState() < SESSION_STATE_EMAIL_VERIFICATION_SEND) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"grd_text\">Die E-Mail wurde nicht verschickt, bitte habe noch etwas Geduld.</div>\n";
	responseStream << "\t\t\t";
#line 157 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"grd_text\">Der Account wurde schon freigeschaltet.</div>\n";
	responseStream << "\t\t\t\t<a href=\"/\">Zurück</a>\n";
	responseStream << "\t\t\t";
#line 160 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t";
#line 161 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t<p>Fehler, bitte wende dich an den Server-Admin order versuche dich erneut zu registrieren.</p>\n";
	responseStream << "\t\t";
#line 163 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 164 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\tUngültige Seite, wenn du das siehst stimmt hier was nicht. Bitte wende dich an den Server-Admin. \n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 168 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
