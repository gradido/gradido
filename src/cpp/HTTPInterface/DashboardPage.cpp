#include "DashboardPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
 
#include "../SingletonManager/SessionManager.h"


DashboardPage::DashboardPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void DashboardPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
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
#line 10 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
 
	//Poco::Net::NameValueCollection cookies;
	//request.getCookies(cookies);
	if(!form.empty()) {
		//form.get("email-verification-code")
	}
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: Dashboard</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"https://gradido2.dario-rekowski.de/css/styles.css\">\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Willkommen ";
#line 28 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
	responseStream << ( mSession->getUser()->getName() );
	responseStream << "</h1>\n";
	responseStream << "\t";
#line 29 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<h3>Status</h3>\n";
	responseStream << "\t<p>";
#line 31 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
	responseStream << ( mSession->getSessionStateString() );
	responseStream << "</p>\n";
	responseStream << "\t";
#line 32 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
 if(mSession->getSessionState() == SESSION_STATE_EMAIL_VERIFICATION_SEND) { 	responseStream << "\n";
	responseStream << "\t<p>Verification Code E-Mail wurde erfolgreich an dich verschickt, bitte schaue auch in dein Spam-Verzeichnis nach wenn du sie nicht findest und klicke auf den Link den du dort findest oder kopiere den Code hier her:</p>\n";
	responseStream << "\t<form method=\"GET\" action=\"checkEmail\">\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" value=\"Überprüfe Code\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 38 "/home/rock/code/gradido_login_server/src/cpsp/dashboard.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t<a class=\"grd_bn\" href=\"logout\">Abmelden</a>\n";
	responseStream << "\t<a class=\"grd_bn\" href=\"user_delete\">Account l&ouml;schen</a>\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
