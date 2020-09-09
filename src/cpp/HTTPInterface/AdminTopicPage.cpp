#include "AdminTopicPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	#include "../controller/HederaAccount.h"
	#include "../controller/Group.h"
	#include "../ServerConfig.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


AdminTopicPage::AdminTopicPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminTopicPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	const char* pageName = "Topic";
	auto user = mSession->getNewUser();
	
	int auto_renew_period = 604800; // 7 Tage
	int auto_renew_account = 0;
	int group_id = 0;
	
	auto hedera_accounts = controller::HederaAccount::load("user_id", user->getModel()->getID());
	
	auto groups = controller::Group::listAll();
	std::map<int, int> group_indices;
	int count = 0;
	for(auto it = groups.begin(); it != groups.end(); it++) {
		group_indices.insert(std::pair<int, int>((*it)->getModel()->getID(), count));
		count++;
	}
	
	
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

	bool withMaterialIcons = false;
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
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/main.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "        <div class=\"center-form-single\">\n";
	responseStream << "            <div class=\"center-form-header\">\n";
	responseStream << "                <a href=\"";
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"center-logo\">\n";
	responseStream << "                    <picture>\n";
	responseStream << "                        <source srcset=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "                        <source srcset=\"";
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\">\n";
	responseStream << "                        <img src=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "                    </picture>\n";
	responseStream << "                </a>\n";
	responseStream << "            </div>";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<style type=\"text/css\">\n";
	responseStream << "\t.center-form-form .input-40 {\n";
	responseStream << "\t\tmargin-left:0;\n";
	responseStream << "\t\twidth:40%;\n";
	responseStream << "\t\tdisplay:inline-block;\n";
	responseStream << "\t}\n";
	responseStream << "\t\n";
	responseStream << "</style>\n";
#line 40 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"content-container info-container\">\n";
	responseStream << "\t<h1>Topic Admin Page</h1>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Ein neues Topic anlegen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\" action=\"";
#line 49 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/topic\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-auto-renew-account\">Auto Renew Hedera Account</label>\n";
	responseStream << "\t\t\t<select name=\"topic-auto-renew-account\" id=\"topic-auto-renew-account\">\n";
	responseStream << "\t\t\t\t";
#line 52 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 for(auto it = hedera_accounts.begin(); it != hedera_accounts.end(); it++) { 
					auto model = (*it)->getModel();
					responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 55 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 55 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 55 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 if(auto_renew_account == model->getID()) {	responseStream << "selected=\"selected\"";
#line 55 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << ">";
#line 55 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( (*it)->toShortSelectOptionName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 56 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-auto-renew-period\">Auto Renew Period in seconds</label>\n";
	responseStream << "\t\t\t<div><input class=\"form-control input-40\" id=\"topic-auto-renew-period\" value=\"";
#line 59 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( auto_renew_period );
	responseStream << "\" type=\"number\" name=\"topic-auto-renew-period\"/><span style=\"margin-left:8px\" id=\"readable-auto-renew-period\"></span><div>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-group\">Group</label>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"topic-group\" id=\"topic-group\">\t\t\t\n";
	responseStream << "\t\t\t\t";
#line 62 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) { 
					auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "\" value=\"";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getID() );
	responseStream << "\" ";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 if(group_id == group_model->getID()) {	responseStream << "selected=\"selected\"";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << ">";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 65 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"";
#line 68 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( gettext("Add Topic") );
	responseStream << "\">\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t</div>\n";
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
	responseStream << "<script type=\"text/javascript\" src=\"";
#line 73 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/js/time_calculations.js\"></script>\n";
	responseStream << "<script type=\"text/javascript\">\n";
	responseStream << "\tvar input = document.getElementById(\"topic-auto-renew-period\");\n";
	responseStream << "\tvar span = document.getElementById(\"readable-auto-renew-period\");\n";
	responseStream << "\tspan.innerHTML = getExactTimeDuration(input.value);\n";
	responseStream << "\tinput.addEventListener('keyup', function(e) {\n";
	responseStream << "\t\tspan.innerHTML = '~ ' + getExactTimeDuration(input.value);\n";
	responseStream << "\t});\n";
	responseStream << "\t\n";
	responseStream << "</script>";
	if (_compressResponse) _gzipStream.close();
}
