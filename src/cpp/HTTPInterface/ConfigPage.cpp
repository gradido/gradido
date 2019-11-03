#include "ConfigPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 4 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\config.cpsp"
 
	const char* pageName = "Config";
#line 1 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


void ConfigPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
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
	responseStream << "\t<p class=\"grd_small\">Alpha 0.4.5</p>\n";
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
	responseStream << "<h1>Config</h1>\n";
	responseStream << "<form method=\"POST\">\n";
	responseStream << "\t<div class=\"grd_container\">\n";
	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Server Admin Key</legend>\n";
	responseStream << "\t\t\t<p>Möchtest du einen neuen Server Key generieren oder einen existierenden verwenden?</p>\n";
	responseStream << "\t\t\t<p>Wenn du bereits einen besitzt kopiere bitte den Merksatz dafür in die Textarea.</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"server-admin-key-new-yes\" type=\"radio\" name=\"new-server-admin-key\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t<label for=\"server-admin-key-new-yes\">Einen neuen generieren!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<input id=\"server-admin-key-new-no\" type=\"radio\" name=\"new-server-admin-key\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t<label for=\"server-admin-key-new-no\">Einen existierenden verwenden!</label>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"server-admin-key-existing\"></textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Login-Server (dieser Server)</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe die Daten für diesen Server an. </p>\n";
	responseStream << "\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t<legend>Datenbank</legend>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"server-db-user\">Benutzernamen: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"server-db-user\" type=\"text\" name=\"server-db-user\" value=\"root\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"server-db-pwd\">Passwort: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"server-db-pwd\" type=\"password\" name=\"server-db-pwd\" value=\"\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"server-db-name\">Datenbank Name: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"server-db-name\" name=\"server-db-name\" value=\"\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t<label for=\"server-domain\">Server Name (Domain)</label>\n";
	responseStream << "\t\t\t\t<input id=\"server-domain\" name=\"server-domain\" type=\"text\">\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>PHP-Server</legend>\n";
	responseStream << "\t\t\t<p>Bitte gebe hier die Daten des php-Servers an.</p>\n";
	responseStream << "\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t<legend>Datenbank</legend>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"php-server-db-user\">Benutzernamen: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"php-server-db-user\" type=\"text\" name=\"php-server-db-user\" value=\"root\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"php-server-db-pwd\">Passwort: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"php-server-db-pwd\" type=\"password\" name=\"php-server-db-pwd\" value=\"\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t\t<label for=\"php-server-db-name\">Datenbank Name: </label>\n";
	responseStream << "\t\t\t\t\t<input id=\"php-server-db-name\" name=\"php-server-db-name\" value=\"\">\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t<div class=\"grd-input\">\n";
	responseStream << "\t\t\t\t<label for=\"php-server-url\">PHP-Server Url (mit Port)</label>\n";
	responseStream << "\t\t\t\t<input id=\"php-server-url\" name=\"php-server-url\" type=\"text\">\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd_bn_succeed\" type=\"submit\" name=\"submit\" value=\"Absenden\">\n";
	responseStream << "\t</div>\n";
	responseStream << "</form>\n";
	responseStream << "</body>\n";
	responseStream << "</html>\n";
	if (_compressResponse) _gzipStream.close();
}
