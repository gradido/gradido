#include "AdminGroupsPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"

	#include "../controller/Group.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

#include "../ServerConfig.h"


AdminGroupsPage::AdminGroupsPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminGroupsPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"

	const char* pageName = "Gruppen";
	
	// add 
	if(!form.empty()) {
		auto alias = form.get("group-alias");
		if(alias == "") 
		{
			addError(new Error("Add Group", "Alias is empty!"));
		} 
		else 
		{
			auto newGroup = controller::Group::create(
				alias, 
				form.get("group-name", ""), 
				form.get("group-url", ""),
				form.get("group-home", ""),
				form.get("group-desc", "")
			);
			newGroup->getModel()->insertIntoDB(false);
		}
	}	
	
	// select all
	auto groups = controller::Group::listAll();
	//auto groups = controller::Group::load("gdd1");
	//std::vector<Poco::SharedPtr<controller::Group>> groups;
	
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

	bool withMaterialIcons = false;
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_large.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/main.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "\t\t<div class=\"sidebar1 nav-menu initial\">\n";
	responseStream << "\t\t\t<div class=\"nav-vertical\">\n";
	responseStream << "\t\t\t\t<ul>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 22 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/groups\"><span class=\"link-title\">Gruppen</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/nodes\"><span class=\"link-title\">Node Server</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/hedera_account\"><span class=\"link-title\">Hedera Accounts</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/topic\"><span class=\"link-title\">Hedera Topics</span></a></li>\n";
	responseStream << "\t\t\t\t</ul>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<div class=\"content\">";
	// end include header_large.cpsp
	responseStream << "\n";
#line 39 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"content-list\">\n";
	responseStream << "\t\t<div class=\"content-list-title\">\n";
	responseStream << "\t\t\t<h2>Alle Gruppen</h2>\n";
	responseStream << "\t\t</div>\t\n";
	responseStream << "\t\t<div class=\"content-list-table\">\n";
	responseStream << "\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c0\">ID</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Name</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Alias</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Url</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Home</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c5\">";
#line 52 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( gettext("Description") );
	responseStream << "</div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 54 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) {
					auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c0\">";
#line 57 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getID() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 58 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 59 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getAlias() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 60 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getUrl() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 61 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getHome() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c5\">";
#line 62 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( group_model->getDescription());
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Eine neue Gruppe anlegen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"group-name\">Name</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"group-name\" type=\"text\" name=\"group-name\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"group-alias\">Alias</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"group-alias\" type=\"text\" name=\"group-alias\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"group-url\">Url</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"group-url\" type=\"text\" name=\"group-url\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"group-home\" title=\"Startpage link\">Home</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"group-home\" type=\"text\" name=\"group-home\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"group-desc\">";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( gettext("Description"));
	responseStream << "</label>\n";
	responseStream << "\t\t\t<textarea class=\"form-control\" name=\"group-desc\" rows=\"3\" maxlength=\"150\" id=\"group-desc\"></textarea>\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminGroups.cpsp"
	responseStream << ( gettext("Add Group") );
	responseStream << "\">\n";
	responseStream << "\t</form>\n";
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
