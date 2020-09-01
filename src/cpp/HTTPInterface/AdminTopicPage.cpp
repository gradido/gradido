#include "AdminTopicPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

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
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	const char* pageName = "Topic";
	
	
	
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
#line 16 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"content-container info-container\">\n";
	responseStream << "\t<h1>Topic Admin Page</h1>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"content-container main-container\">\n";
	responseStream << "\t\n";
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
