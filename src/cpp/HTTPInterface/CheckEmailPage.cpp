#include "CheckEmailPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"




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
#line 10 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"

	bool hasErrors = false;
	if(mSession) {
		hasErrors = mSession->errorCount() > 0;
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
	responseStream << "<title>Gradido Login Server: Email Verification</title>\n";
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
#line 45 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
 if(mSession && hasErrors) {	responseStream << "\n";
	responseStream << "\t\t";
#line 46 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 47 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
} 	responseStream << "\n";
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 49 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
 if(mSession && mSession->getSessionState() < SESSION_STATE_EMAIL_VERIFICATION_SEND) { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t<p>Die E-Mail wurde noch nicht verschickt, bitte habe noch etwas Geduld.</p>\n";
	responseStream << "\t\t\t<p>Versuche es einfach in 1-2 Minuten erneut.</p>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 54 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t<form method=\"GET\">\n";
	responseStream << "\t\t<p>Bitte gebe deinen E-Mail Verification Code ein. </p>\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Überprüfe Code\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 60 "/home/rock/code/gradido_login_server/src/cpsp/checkEmail.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
