#include "RegisterPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 4 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPCookie.h"


void RegisterPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 8 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"

	auto session = SessionManager::getInstance()->getNewSession();
	bool userReturned = false;
	
	if(!form.empty()) {
		if(form.get("register-password2") != form.get("register-password")) {
			session->addError(new Error("Passwort", "Passw&ouml;rter sind nicht identisch."));
		} else {
			userReturned = session->createUser(
				form.get("register-name"),
				form.get("register-email"),
				form.get("register-password")
			);
		}
		if(userReturned) {
			auto user_host = request.clientAddress().host();
			session->setClientIp(user_host);
			response.addCookie(session->getLoginCookie());
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
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 57 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
 if(!form.empty() && userReturned) {	responseStream << "\n";
	responseStream << "\t\t\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tDeine Anmeldung wird verarbeitet und es wird dir eine E-Mail zugeschickt. \n";
	responseStream << "\t\t\t\tWenn sie da ist, befolge ihren Anweisungen. \n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 65 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\n";
	responseStream << "\t\t";
#line 68 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
 if(!form.empty() && !userReturned) {	responseStream << "\n";
	responseStream << "\t\t\t";
#line 69 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
	responseStream << ( session->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t\t";
#line 70 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
} 	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Account anlegen</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe deine Daten um einen Account anzulegen</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-name\">Vorname</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-name\" type=\"text\" name=\"register-name\" value=\"";
#line 76 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-email\" type=\"email\" name=\"register-email\" value=\"";
#line 80 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
	responseStream << ( !form.empty() ? form.get("register-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password\" type=\"password\" name=\"register-password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-password\">Passwort Best&auml;tigung</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-password2\" type=\"password\" name=\"register-password2\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Anmelden\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 94 "/home/rock/code/gradido_login_server/src/cpsp/register.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
