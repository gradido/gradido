#include "RegisterAdminPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../controller/Group.h"
#include "../lib/DataTypeConverter.h"

#include "Poco/Net/HTTPCookie.h"

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


RegisterAdminPage::RegisterAdminPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void RegisterAdminPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"

	const char* pageName = "Admin Registrieren";
	auto sm = SessionManager::getInstance();
	
	bool userReturned = false;
	
	if(!form.empty()) {			
		auto group_id_string = form.get("register-group", "0");
		int group_id = 0;
		if(!sm->isValid(group_id_string, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Group id", "group_id not integer"));
		} else {
			if(DataTypeConverter::strToInt(group_id_string, group_id) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int Convert Error", "Error converting group_id to int"));
			}
		}
		if(!errorCount()) {
			userReturned = mSession->adminCreateUser(
				form.get("register-first-name", ""),
				form.get("register-last-name", ""),
				form.get("register-email", ""),
				group_id
			);
			getErrors(mSession);
		}
		
	}
	
	auto groups = controller::Group::listAll();
		
	
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
	responseStream << "\t<h1>Einen neuen Account anlegen</h1>\n";
	responseStream << "\t";
#line 49 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 50 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
 if(!form.empty() && userReturned) {	responseStream << "\n";
	responseStream << "\t\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t\t<div class=\"grd_text\">\n";
	responseStream << "\t\t\t\tDie Anmeldung wird verarbeitet und es wird dem Benutzer eine Aktivierungs-E-Mail zugeschickt. \n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t";
#line 56 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Account anlegen</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe die Benutzer-Daten ein um einen Account anzulegen</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-first-name\">Vorname</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-first-name\" type=\"text\" name=\"register-first-name\" value=\"";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( !form.empty() ? form.get("register-first-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-last-name\">Nachname</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-last-name\" type=\"text\" name=\"register-last-name\" value=\"";
#line 68 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( !form.empty() ? form.get("register-last-name") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"register-email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"register-email\" type=\"email\" name=\"register-email\" value=\"";
#line 72 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( !form.empty() ? form.get("register-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"register-group\">\n";
	responseStream << "\t\t\t\t";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) { 
					auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "\" value=\"";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( group_model->getID() );
	responseStream << "\">";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed\" type=\"submit\" name=\"submit\" value=\"Anmelden\">\n";
	responseStream << "\t\t\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\registerAdmin.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
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
