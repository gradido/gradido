#include "AdminNodeServerPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"


#include "../controller/NodeServer.h"
#include "../controller/Group.h"
#include "../SingletonManager/SessionManager.h"
#include "../lib/DataTypeConverter.h"

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

#include "../ServerConfig.h"


AdminNodeServerPage::AdminNodeServerPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminNodeServerPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"

	const char* pageName = "Node Server";
	auto sm = SessionManager::getInstance();
	
	// add 
	if(!form.empty()) {
		// collect
		auto url = form.get("node-server-url", "");
		auto portString = form.get("node-server-port", "");
		auto nodeServerTypeString = form.get("node-server-type", "0");
		auto shardNumString = form.get("account-shard-num", "0");
		auto realmNumString = form.get("account-realm-num", "0");
		auto numString      = form.get("account-num", "0");
		auto nodeServerGroupString = form.get("node-server-group", "");
		
		int port  = 0;
		int shardNum = 0;
		int realmNum = 0;
		int num = 0;
		model::table::NodeServerType nodeServerType = model::table::NODE_SERVER_NONE;
		int group_id = 0;
		
		
		// validate
		if(!sm->isValid(url, VALIDATE_ONLY_URL)) {
			addError(new ParamError("Node Server", "Url not valid, must start with http or https", url));
			
		}
		if(!sm->isValid(portString, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Node Server", "Port isn't valid integer"));
		} else {
			if(DataTypeConverter::strToInt(portString, port) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int convert error", "Error converting port to int"));
			}
		}
		
		if(!sm->isValid(nodeServerTypeString, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Node Server Type", "not integer"));
		} else {
			int node_server_type_int = 0;
			if(DataTypeConverter::strToInt(nodeServerTypeString, node_server_type_int) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int Convert Error", "Error converting node server type to int"));
			}
			if(node_server_type_int < 0 || node_server_type_int >= (int)model::table::NODE_SERVER_TYPE_COUNT) {
				addError(new Error("Node Server Type", "invalid value"));
			} else {
				nodeServerType = (model::table::NodeServerType)node_server_type_int;
			}
		}
		if(model::table::NodeServerIsHederaNode(nodeServerType)) {
	    
			if(!sm->isValid(shardNumString, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Account ID", "shard num not integer"));
			} else {
				if(DataTypeConverter::strToInt(shardNumString, shardNum) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int Convert Error", "Error converting shardNumString to int"));
				}
			}
			if(!sm->isValid(realmNumString, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Account ID", "realm num not integer"));
			} else {
				if(DataTypeConverter::strToInt(realmNumString, realmNum) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int Convert Error", "Error converting realmNumString to int"));
				}
			}
			if(!sm->isValid(numString, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Account ID", "num not integer"));
			} else {
				if(DataTypeConverter::strToInt(numString, num) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int Convert Error", "Error converting num to int"));
				}
			}
		} else if(model::table::NodeServerHasGroup(nodeServerType)) {
			if(!sm->isValid(nodeServerGroupString, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Group id", "group_id not integer"));
			} else {
				if(DataTypeConverter::strToInt(nodeServerGroupString, group_id) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int Convert Error", "Error converting group_id to int"));
				}
			}
		}
		
		
		
		if(0 == errorCount()) {
			int hedera_id_int = 0;
			if(NodeServerIsHederaNode(nodeServerType)) {
				auto hedera_id = controller::HederaId::create(shardNum, realmNum, num);
				hedera_id_int = hedera_id->getModel()->getID();
		    }
			
			auto node_server = controller::NodeServer::create(
				url, port, group_id, (model::table::NodeServerType)nodeServerType, hedera_id_int
			);
			if(!node_server->getModel()->insertIntoDB(false)) {
				addError(new Error("DB Error", "Error saving Node Server in DB"));
			}
		}
	}		
	auto groups = controller::Group::listAll();
	std::map<int, int> group_indices;
	int count = 0;
	for(auto it = groups.begin(); it != groups.end(); it++) {
		group_indices.insert(std::pair<int, int>((*it)->getModel()->getID(), count));
		count++;
	}
	
	auto node_servers = controller::NodeServer::listAll();
	
	
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
#line 126 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"content-list\">\n";
	responseStream << "\t\t<div class=\"content-list-title\">\n";
	responseStream << "\t\t\t<h2>Alle Node Server</h2>\n";
	responseStream << "\t\t</div>\t\n";
	responseStream << "\t\t<div class=\"content-list-table\">\n";
	responseStream << "\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c4\">Server Type</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c5\">Url:Port</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Group / Hedera Id</div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 138 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 for(auto it = node_servers.begin(); it != node_servers.end(); it++) {
					auto node_server_model = (*it)->getModel();  
						responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c4\">";
#line 142 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( model::table::NodeServer::nodeServerTypeToString(node_server_model->getNodeServerType()) );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c5\">";
#line 143 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( node_server_model->getUrlWithPort() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">\n";
	responseStream << "\t\t\t\t\t\t";
#line 145 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 if(node_server_model->isHederaNode()) { 
							auto hedera_id_model = (*it)->getHederaId()->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 147 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( hedera_id_model->toString() );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 148 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } else if(node_server_model->hasGroup()){ 
							auto groupIt = group_indices.find(node_server_model->getGroupId());
							if(groupIt != group_indices.end()) { 
								auto group_model = groups[groupIt->second]->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t\t<span title=\"";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "\">";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 153 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t\t";
#line 154 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( node_server_model->getGroupId() );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 155 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 156 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 159 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Ein Node Server hinzufügen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"node-server-url\">URL</label>\n";
	responseStream << "\t\t\t<input required class=\"form-control\" id=\"node-server-url\" name=\"node-server-url\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"node-server-port\">Port</label>\n";
	responseStream << "\t\t\t<input required class=\"form-control\" id=\"node-server-port\" name=\"node-server-port\" type=\"number\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"node-server-type\">Network Type</label>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"node-server-type\" id=\"node-server-type\">\n";
	responseStream << "\t\t\t";
#line 173 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 for(int i = 1; i < model::table::NODE_SERVER_TYPE_COUNT; i++) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<option value=\"";
#line 174 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( i );
	responseStream << "\">";
#line 174 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( model::table::NodeServer::nodeServerTypeToString((model::table::NodeServerType)i) );
	responseStream << "</option>\n";
	responseStream << "\t\t\t";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t<legend>Nur für Hedera Nodes</legend>\n";
	responseStream << "\t\t\t\t<label class=\"form-label\">Hedera Account ID</label>\n";
	responseStream << "\t\t\t\t<input class=\"form-control\" id=\"account-shard-num\" placeholder=\"shard\" type=\"number\" name=\"account-shard-num\"/>\n";
	responseStream << "\t\t\t\t<input class=\"form-control\" id=\"account-realm-num\" placeholder=\"realm\" type=\"number\" name=\"account-realm-num\"/>\n";
	responseStream << "\t\t\t\t<input class=\"form-control\" id=\"account-num\" placeholder=\"num\" type=\"number\" name=\"account-num\"/>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t<legend>Nur für Gradido Nodes</legend>\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"node-server-group\">Gradido Gruppe</label>\n";
	responseStream << "\t\t\t\t<select class=\"form-control\" name=\"node-server-group\">\n";
	responseStream << "\t\t\t\t\t<option value=\"-1\">Keine Gruppe</option>\n";
	responseStream << "\t\t\t\t\t";
#line 189 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) { 
						auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<option title=\"";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "\" value=\"";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( group_model->getID() );
	responseStream << "\">";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t";
#line 192 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</select>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"";
#line 196 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServer.cpsp"
	responseStream << ( gettext("Add Node") );
	responseStream << "\">\n";
	responseStream << "\t</form>\n";
	responseStream << "</div>\n";
	responseStream << "\n";
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
