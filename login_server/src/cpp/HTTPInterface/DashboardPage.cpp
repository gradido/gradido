#include "DashboardPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
 
#include "../SingletonManager/SessionManager.h"
#include "Poco/Net/HTTPServerParams.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


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
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"

	const char* pageName = "Dashboard";
	auto user = mSession->getNewUser();
	auto user_model = user->getModel();
	//Poco::Net::NameValueCollection cookies;
	//request.getCookies(cookies);
	if(!form.empty()) {
		//form.get("email-verification-code")
	}
	auto uri_start = getBaseUrl();
	//response.redirect(ServerConfig::g_php_serverPath);
	response.redirect(user->getGroupBaseUrl());
	return;
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_old.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
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
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 53 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	// end include header_old.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Willkommen ";
#line 26 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( user_model->getFirstName() );
	responseStream << "&nbsp;";
#line 26 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( user_model->getLastName() );
	responseStream << "</h1>\n";
	responseStream << "\t";
#line 27 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( mSession->getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<h3>Status</h3>\n";
	responseStream << "\t<p>";
#line 29 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( mSession->getSessionStateString() );
	responseStream << "</p>\n";
	responseStream << "\t";
#line 30 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
 if(mSession->getSessionState() == SESSION_STATE_EMAIL_VERIFICATION_SEND) { 	responseStream << "\n";
	responseStream << "\t<p>Verification Code E-Mail wurde erfolgreich an dich verschickt, bitte schaue auch in dein Spam-Verzeichnis nach wenn du sie nicht findest und klicke auf den Link den du dort findest oder kopiere den Code hier her:</p>\n";
	responseStream << "\t<form method=\"GET\" action=\"";
#line 32 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( uri_start );
	responseStream << "/checkEmail\">\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd-form-bn-succeed grd_clickable\" type=\"submit\" value=\"&Uuml;berpr&uuml;fe Code\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 36 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
 } else if(mSession->getSessionState() == SESSION_STATE_EMAIL_VERIFICATION_WRITTEN) { 	responseStream << "\n";
	responseStream << "\t<p>Hast du schon eine E-Mail mit einem Verification Code erhalten? Wenn ja kannst du ihn hier hinein kopieren:</p>\n";
	responseStream << "\t<form method=\"GET\" action=\"checkEmail\">\n";
	responseStream << "\t\t<input type=\"number\" name=\"email-verification-code\">\n";
	responseStream << "\t\t<input class=\"grd-form-bn-succeed grd_clickable\" type=\"submit\" value=\"&Uuml;berpr&uuml;fe Code\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 42 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t<a class=\"grd-form-bn\" href=\"";
#line 43 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( uri_start );
	responseStream << "/logout\">Abmelden</a>\n";
	responseStream << "\t<a class=\"grd-form-bn\" href=\"";
#line 44 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( uri_start );
	responseStream << "/user_delete\">Account l&ouml;schen</a>\n";
	responseStream << "</div>\n";
	responseStream << "<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 49 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( user->getGroupBaseUrl() );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"";
#line 50 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\dashboard.cpsp"
	responseStream << ( uri_start );
	responseStream << "/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>\n";
	// begin include footer.cpsp
	responseStream << "            <div class=\"center-bottom\">\n";
	responseStream << "                <p>Copyright © Gradido 2020</p>\n";
	responseStream << "            </div>\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomleft\">\n";
	responseStream << "            ";
#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"bottomright\">\n";
	responseStream << "            <p>Login Server in Entwicklung</p>\n";
	responseStream << "            <p>Alpha ";
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "        </div>\n";
	responseStream << "    </div>\n";
	responseStream << "</body>\n";
	responseStream << "\n";
	responseStream << "</html>";
	// end include footer.cpsp
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
