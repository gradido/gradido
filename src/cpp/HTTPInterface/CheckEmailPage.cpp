#include "CheckEmailPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"

#include "../SingletonManager/SessionManager.h"

enum PageState 
{
	MAIL_NOT_SEND,
	ASK_VERIFICATION_CODE
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
#line 16 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"

	const char* pageName = "Email Verification";
	
	// remove old cookies if exist
	auto sm = SessionManager::getInstance();
	sm->deleteLoginCookies(request, response, mSession);
	PageState state = ASK_VERIFICATION_CODE;
	if(mSession) {
		getErrors(mSession);
		if(mSession->getSessionState() < SESSION_STATE_EMAIL_VERIFICATION_SEND) {
			//state = MAIL_NOT_SEND;
		}
	}


	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header.cpsp
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 6 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
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
	responseStream << "\tleft:0;\n";
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
	responseStream << "\t<p>Login Server in Entwicklung</p>\n";
	responseStream << "\t<p>Alpha 0.4.1</p>\n";
	responseStream << "</div>";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 35 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 36 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(state == MAIL_NOT_SEND) { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t<p>Die E-Mail wurde noch nicht verschickt, bitte habe noch etwas Geduld.</p>\n";
	responseStream << "\t\t\t<p>Versuche es einfach in 1-2 Minuten erneut.</p>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 41 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else if(state == ASK_VERIFICATION_CODE) { 	responseStream << "\n";
	responseStream << "\t<form method=\"GET\">\n";
	responseStream << "\t\t<p>Bitte gebe deinen E-Mail Verification Code ein. </p>\n";
	responseStream << "\t\t";
#line 44 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 if(mSession && !mSession->getUser().isNull()) {	responseStream << "\n";
	responseStream << "\t\t\t<p>Er wurde an deine E-Mail Adresse: ";
#line 45 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
	responseStream << ( mSession->getUser()->getEmail() );
	responseStream << " gesendet.</p>\n";
	responseStream << "\t\t";
#line 46 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Überprüfe Code\">\n";
	responseStream << "\t\t<p>Du hast bisher keinen Code erhalten? </p>\n";
	responseStream << "\t\t<p>E-Mail erneut zuschicken (in Arbeit)</p>\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 52 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\tUngültige Seite, wenn du das siehst stimmt hier etwas nicht. Bitte wende dich an den Server-Admin. \n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 56 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkEmail.cpsp"
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
