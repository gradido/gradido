#include "AdminNodeServerTestPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"


#include "../controller/NodeServer.h"
#include "../controller/User.h"
#include "../controller/HederaTopic.h"
#include "../lib/DataTypeConverter.h"
#include "../lib/Profiler.h"
#include "../lib/JsonRPCRequest.h"
#include "../model/gradido/Transaction.h"

#include "Poco/Thread.h"
#include "Poco/DateTime.h"
#include "Poco/JSON/Stringifier.h"

enum PageType
{
	PAGE_CHOOSE_TEST,
	PAGE_RUN_4_SET_TEST,
	PAGE_GET_TRANSACTION_RPC_CALL
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

#include "../ServerConfig.h"


void AdminNodeServerTestPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 28 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"

	const char* pageName = "Node Server Test";
	PageType page = PAGE_CHOOSE_TEST;
	Poco::AutoPtr<controller::NodeServer> node_server;
	Poco::AutoPtr<controller::NodeServer> node_server2;
	Poco::AutoPtr<controller::User> user;
	Poco::AutoPtr<controller::HederaTopic> hedera_topic;
	Poco::AutoPtr<controller::HederaTopic> hedera_topic2;
	int hedera_timeout = 4;
	int sleep_ms_between_transactions = 1000;
	
	bool steps[8]; memset(steps, 1, 8 * sizeof(bool));
	
	
	if(!form.empty()) 
	{
		auto node_server_id_string = form.get("test-node-servers", "");
		if(node_server_id_string != "") {
			int node_server_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(node_server_id_string, node_server_id )) {
				node_server = controller::NodeServer::load(node_server_id);
			}
		}
		node_server_id_string = form.get("test-node-servers2", "");
		if(node_server_id_string != "") {
			int node_server_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(node_server_id_string, node_server_id )) {
				node_server2 = controller::NodeServer::load(node_server_id);
			}
		}
		auto topic_id_string = form.get("test-hedera-topic", "");
		if(topic_id_string != "") {
			int topic_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(topic_id_string, topic_id)) {
				hedera_topic = controller::HederaTopic::load(topic_id);
			}
		}
		topic_id_string = form.get("test-hedera-topic2", "");
		if(topic_id_string != "") {
			int topic_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(topic_id_string, topic_id)) {
				hedera_topic2 = controller::HederaTopic::load(topic_id);
			}
		}
		auto test_timeout_string = form.get("test-timeout", "");
		if(test_timeout_string != "") {
			DataTypeConverter::strToInt(test_timeout_string, hedera_timeout);
		}
		auto submit = form.get("submit", "");
		if(submit == "Run 6-Test") {
			page = PAGE_RUN_4_SET_TEST;
		} else if(submit == "json-rpc getTransactions") {
			page = PAGE_GET_TRANSACTION_RPC_CALL;
		}
		std::string step_temp;
		for(int i = 0; i < 8; i++) {
			std::string name = "step-";
			name += std::to_string(i+2);
			step_temp = form.get(name, "");
			if(step_temp == "1") {
				steps[i] = true;
			} else {
				steps[i] = false;
			}
		}
	}		

	auto node_servers = controller::NodeServer::load(model::table::NODE_SERVER_GRADIDO_NODE);	
	auto hedera_topics = controller::HederaTopic::listAll();
	
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
	responseStream << "\t\t\t\t\t";
#line 22 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
 if(!user.isNull()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<li><a href=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( user->getGroupBaseUrl() );
	responseStream << "/\"><span class=\"link-title\">Startseite</span></a></li>\n";
	responseStream << "\t\t\t\t\t";
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/groups\"><span class=\"link-title\">Gruppen</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 26 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/nodes\"><span class=\"link-title\">Node Server</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 27 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/hedera_account\"><span class=\"link-title\">Hedera Accounts</span></a></li>\n";
	responseStream << "\t\t\t\t\t<li><a href=\"";
#line 28 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/topic\"><span class=\"link-title\">Hedera Topics</span></a></li>\n";
	responseStream << "\t\t\t\t</ul>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<div class=\"content\">";
	// end include header_large.cpsp
	responseStream << "\n";
#line 99 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<!-- Tab links -->\n";
	responseStream << "\t<div class=\"tab\">\n";
	responseStream << "\t  <button class=\"tablinks ";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_RUN_4_SET_TEST == page) { 	responseStream << " active ";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\" onclick=\"openTab(event, 'test-4')\">Test 6-Set (3 AddMember, Creation, 2 Transfer)</button>\n";
	responseStream << "\t  <button class=\"tablinks ";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_GET_TRANSACTION_RPC_CALL == page) { 	responseStream << " active ";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\" onclick=\"openTab(event, 'gn-jsonrpc')\" title=\"call via json-rpc to gradido node with getTransactions\">getTransactions</button>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div id=\"test-4\" class=\"tabcontent\" ";
#line 106 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_RUN_4_SET_TEST == page) { 	responseStream << " style=\"display:block\" ";
#line 106 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t\t<div class=\"center-form-title\">\n";
	responseStream << "\t\t\t<h3>Test 6-Set (3 AddMember, Creation, 2 Transfer)</</h3>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t\t<form method=\"POST\" action=\"";
#line 111 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/adminNodeServerTest\">\n";
	responseStream << "\t\t\t\t<p>1. Create three new accounts and show user public keys for comparisation</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 113 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[0]) { 	responseStream << " checked=\"checked\" ";
#line 113 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-2\" value=\"1\"/> 2. Send a add-member transaction to hedera topic with one signature (first user)</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[1]) { 	responseStream << " checked=\"checked\" ";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-3\" value=\"1\"/> 3. Send a add-member transaction to hedera topic with two signatures (first user and second user)</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 115 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[2]) { 	responseStream << " checked=\"checked\" ";
#line 115 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-4\" value=\"1\"/> 4. Send a creation transaction to second user, signed by first user</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 116 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[3]) { 	responseStream << " checked=\"checked\" ";
#line 116 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-5\" value=\"1\"/> 5. Send a transfer transaction from second user to first user signed by second user</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 117 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[4]) { 	responseStream << " checked=\"checked\" ";
#line 117 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-6\" value=\"1\"/> 6. Send a add-member transaction to hedera topic 2 with one signature (third user)</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 118 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[5]) { 	responseStream << " checked=\"checked\" ";
#line 118 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-7\" value=\"1\"/> 7. Send a cross group transfer from second user to third user signed by second user</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 119 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[6]) { 	responseStream << " checked=\"checked\" ";
#line 119 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-8\" value=\"1\"/> 8. Wait x seconds to give hedera time to process transactions</p>\n";
	responseStream << "\t\t\t\t<p><input class=\"form-checkbox\" type=\"checkbox\" ";
#line 120 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(steps[7]) { 	responseStream << " checked=\"checked\" ";
#line 120 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " name=\"step-9\" value=\"1\"/> 9. Ask choosen node for transaction and print result</p>\n";
	responseStream << "\t\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t\t<legend>Group 1 </legend>\n";
	responseStream << "\t\t\t\t\t<label class=\"form-label\" for=\"test-node-servers\">Node Server for tests</label>\n";
	responseStream << "\t\t\t\t\t";
#line 124 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(node_servers.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<a href=\"";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/nodes\"><span class=\"link-title\">Edit Node-Servers</span></a>\n";
	responseStream << "\t\t\t\t\t";
#line 126 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<select name=\"test-node-servers\" id=\"test-node-servers\">\n";
	responseStream << "\t\t\t\t\t\t";
#line 128 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = node_servers.begin(); it != node_servers.end(); it++) { 
							auto model = (*it)->getModel();
							responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<option title=\"";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!node_server.isNull() && node_server->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getUrlWithPort() );
	responseStream << ", group: ";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t\t";
#line 132 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t\t<label class=\"form-label\" for=\"test-hedera-topic\">Hedera Topic for tests</label>\n";
	responseStream << "\t\t\t\t\t";
#line 135 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(hedera_topics.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<a href=\"";
#line 136 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/topic\"><span class=\"link-title\">Edit Hedera-Topics</span></a>\n";
	responseStream << "\t\t\t\t\t";
#line 137 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<select name=\"test-hedera-topic\" id=\"test-hedera-topic\">\n";
	responseStream << "\t\t\t\t\t\t";
#line 139 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = hedera_topics.begin(); it != hedera_topics.end(); it++) { 
							auto model = (*it)->getModel();
							auto hedera_account = (*it)->getAutoRenewAccount();
							if(hedera_account->getModel()->getNetworkType() != ServerConfig::HEDERA_TESTNET) {
								continue;
							}
							responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<option title=\"";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!hedera_topic.isNull() && hedera_topic->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getName() );
	responseStream << ", group: ";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t\t";
#line 147 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t</fieldset>\n";
	responseStream << "\t\t\t\t<fieldset>\n";
	responseStream << "\t\t\t\t\t<legend>Group 2 </legend>\n";
	responseStream << "\t\t\t\t\t<label class=\"form-label\" for=\"test-node-servers2\">Node Server for tests</label>\n";
	responseStream << "\t\t\t\t\t";
#line 153 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(node_servers.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<a href=\"";
#line 154 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/nodes\"><span class=\"link-title\">Edit Node-Servers</span></a>\n";
	responseStream << "\t\t\t\t\t";
#line 155 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<select name=\"test-node-servers2\" id=\"test-node-servers2\">\n";
	responseStream << "\t\t\t\t\t\t";
#line 157 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = node_servers.begin(); it != node_servers.end(); it++) { 
							auto model = (*it)->getModel();
							responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<option title=\"";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!node_server2.isNull() && node_server2->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getUrlWithPort() );
	responseStream << ", group: ";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t\t";
#line 161 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t\t<label class=\"form-label\" for=\"test-hedera-topic2\">Hedera Topic for tests</label>\n";
	responseStream << "\t\t\t\t\t";
#line 164 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(hedera_topics.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<a href=\"";
#line 165 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/topic\"><span class=\"link-title\">Edit Hedera-Topics</span></a>\n";
	responseStream << "\t\t\t\t\t";
#line 166 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<select name=\"test-hedera-topic2\" id=\"test-hedera-topic2\">\n";
	responseStream << "\t\t\t\t\t\t";
#line 168 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = hedera_topics.begin(); it != hedera_topics.end(); it++) { 
							auto model = (*it)->getModel();
							auto hedera_account = (*it)->getAutoRenewAccount();
							if(hedera_account->getModel()->getNetworkType() != ServerConfig::HEDERA_TESTNET) {
								continue;
							}
							responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<option title=\"";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!hedera_topic2.isNull() && hedera_topic2->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getName() );
	responseStream << ", group: ";
#line 175 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t\t";
#line 176 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t</fieldset>\n";
	responseStream << "\t\t\t\t\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"test-timeout\">Timeout waiting for hedera in seconds</label>\n";
	responseStream << "\t\t\t\t<input name=\"test-timeout\" id=\"test-timeout\" type=\"number\" value=\"";
#line 181 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( hedera_timeout );
	responseStream << "\"> seconds \n";
	responseStream << "\t\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"Run 6-Test\">\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div id=\"gn-jsonrpc\" class=\"tabcontent\" ";
#line 186 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_GET_TRANSACTION_RPC_CALL == page) { 	responseStream << " style=\"display:block\" ";
#line 186 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t\t<div class=\"center-form-title\">\n";
	responseStream << "\t\t\t<h3>Test 4-Set (2 AddMember, Creation, Transfer)</</h3>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t\t<form method=\"POST\" action=\"";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/adminNodeServerTest\">\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"test-node-servers\">Node Server to call</label>\n";
	responseStream << "\t\t\t\t";
#line 193 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(node_servers.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<a href=\"";
#line 194 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/nodes\"><span class=\"link-title\">Edit Node-Servers</span></a>\n";
	responseStream << "\t\t\t\t";
#line 195 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t<select name=\"test-node-servers\" id=\"test-node-servers\">\n";
	responseStream << "\t\t\t\t\t";
#line 197 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = node_servers.begin(); it != node_servers.end(); it++) { 
						auto model = (*it)->getModel();
						responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<option title=\"";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!node_server.isNull() && node_server->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getUrlWithPort() );
	responseStream << ", group: ";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t";
#line 201 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"json-rpc getTransactions\">\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t";
#line 207 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_RUN_4_SET_TEST == page && !hedera_topic.isNull() && !node_server.isNull()) { 	responseStream << "\n";
	responseStream << "\t<ul>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>1. Create three new accounts and show user public keys for comparisation: </p>\n";
	responseStream << "\t\t\t";
#line 211 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			Profiler time2;
			auto group_id = hedera_topic->getModel()->getGroupId();
			auto group_id2 = hedera_topic2->getModel()->getGroupId();
			auto user_group = controller::Group::load(group_id);
			auto user_group2 = controller::Group::load(group_id2);
			auto mnemonic_type = ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER;
			
			std::string password1 = "hsaj(2askaslASlllak3wjjeudsaj";
			auto user_1 = controller::User::create("testEmail@google.de", "Max", "Mustermann", group_id);
			auto passphrase_1 = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[mnemonic_type]);
			auto gradido_key_pair_1 = KeyPairEd25519::create(passphrase_1);
			user_1->setGradidoKeyPair(gradido_key_pair_1);
			user_1->login(password1);
			
			std::string password2 = "uweia8saiSale,dsasA";
			auto user_2 = controller::User::create("testEmail2@google.de", "MJax", "Mustrermann", group_id);
			auto passphrase_2 = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[mnemonic_type]);
			auto gradido_key_pair_2 = KeyPairEd25519::create(passphrase_2);
			user_2->setGradidoKeyPair(gradido_key_pair_2);
			user_2->login(password2);
			
			std::string password3 = "jaue_skaiellasealaK";
			auto user_3 = controller::User::create("testEmail3@gmail.com", "Morpheus", "Miaufull", group_id2);
			auto passphrase_3 = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[mnemonic_type]);
			auto gradido_key_pair_3 = KeyPairEd25519::create(passphrase_3);
			user_3->setGradidoKeyPair(gradido_key_pair_3);
			user_3->login(password3);
				responseStream << "\t\t\t\n";
	responseStream << "\t\t\t<fieldset><legend>";
#line 240 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_group->getModel()->getName() );
	responseStream << "</legend>\n";
	responseStream << "\t\t\t\t<p>User 1: ";
#line 241 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_1->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t<p>User 2: ";
#line 242 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_2->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t<fieldset><legend>";
#line 244 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_group2->getModel()->getName() );
	responseStream << "</legend>\n";
	responseStream << "\t\t\t\t<p>User 3: ";
#line 245 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_3->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</fieldset>\n";
	responseStream << "\t\t\t<p>Time: ";
#line 247 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>2. Send a add-member transaction to hedera topic with one signature (first user)</p>\n";
	responseStream << "\t\t\t";
#line 251 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset(); 
			if(!steps[0]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 255 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else {
			auto transaction1 = model::gradido::Transaction::createGroupMemberUpdate(user_1, user_group);
			transaction1->getTransactionBody()->getGroupMemberUpdate()->setMinSignatureCount(1);
			transaction1->sign(user_1);
			auto transaction1_json = transaction1->getTransactionAsJson(true);
				responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 261 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction1_json) );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 262 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 263 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>3. Send a add-member transaction to hedera topic with two signatures (first user and second user)</p>\n";
	responseStream << "\t\t\t";
#line 267 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset();  
			if(!steps[1]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 271 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else {
			auto transaction2 = model::gradido::Transaction::createGroupMemberUpdate(user_2, user_group);
			transaction2->getTransactionBody()->getGroupMemberUpdate()->setMinSignatureCount(2);
			transaction2->sign(user_2);
			// wait before sending fourth transaction, gn seems to crash by more than 3 transaction at nearly the same time
			Poco::Thread::sleep(sleep_ms_between_transactions);
			transaction2->sign(user_1);
			auto transaction2_json = transaction2->getTransactionAsJson(true);
				responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 280 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction2_json) );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 281 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 282 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>4. Send a creation transaction to second user, signed by first user</p>\n";
	responseStream << "\t\t\t";
#line 286 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"

			time2.reset();
			if(!steps[2]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 290 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else {
			auto transaction3 = model::gradido::Transaction::createCreation(user_2, 10000000, Poco::DateTime(), "Test Creation");
			// wait before sending fourth transaction, gn seems to crash by more than 3 transaction at nearly the same time
			Poco::Thread::sleep(sleep_ms_between_transactions);
			transaction3->sign(user_1);
			auto transaction3_json = transaction3->getTransactionAsJson(true);
				responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 297 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction3_json) );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 298 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 299 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "</p>\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>5. Send a transfer transaction from second user to first user signed by second user</p>\n";
	responseStream << "\t\t\t";
#line 303 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset(); 
			if(!steps[3]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 307 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else {
			auto user_1_pubkey = user_1->getModel()->getPublicKeyCopy();
			auto transaction4 = model::gradido::Transaction::createTransfer(user_2, user_1_pubkey, user_group, 5000000, "Test Transfer");
			// wait before sending fourth transaction, gn seems to crash by more than 3 transaction at nearly the same time
			Poco::Thread::sleep(sleep_ms_between_transactions);
			transaction4[0]->sign(user_2);
			auto transaction4_json = transaction4[0]->getTransactionAsJson(true);
				responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 315 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction4_json) );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 316 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 317 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "</p>\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>6. Send a add-member transaction to hedera topic 2 with one signature (third user)</p>\n";
	responseStream << "\t\t\t";
#line 321 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset();
			if(!steps[4]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 325 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else { 
			auto transaction5 = model::gradido::Transaction::createGroupMemberUpdate(user_3, user_group2);
			transaction5->getTransactionBody()->getGroupMemberUpdate()->setMinSignatureCount(1);
			Poco::Thread::sleep(sleep_ms_between_transactions);
			transaction5->sign(user_3);
			auto transaction5_json = transaction5->getTransactionAsJson(true);
				responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 332 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction5_json) );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 333 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 334 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "</p>\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>7. Send a cross group transfer from second user to third user signed by second user</p>\n";
	responseStream << "\t\t\t";
#line 338 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset(); 
			if(!steps[5]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 342 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else {
				auto user_3_pubkey = user_3->getModel()->getPublicKeyCopy();
				auto transaction6 = model::gradido::Transaction::createTransfer(user_2, user_3_pubkey, user_group2, 4000000, "Test Group Transfer", false);
				if(!transaction6.size()) {
						responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"alert alert-error\" role=\"alert\">\n";
	responseStream << "\t\t\t\t\t<i class=\"material-icons-outlined\">report_problem</i>\n";
	responseStream << "\t\t\t\t\t<span>Error creating Transaction</span>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t";
#line 351 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
				} else {
					Poco::Thread::sleep(sleep_ms_between_transactions);
					transaction6[0]->sign(user_2);
					auto transaction6_json = transaction6[0]->getTransactionAsJson(true);
						responseStream << "\n";
	responseStream << "\t\t\t\t\t<p>";
#line 357 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(transaction6_json) );
	responseStream << "</p>\t\t\n";
	responseStream << "\t\t\t\t";
#line 358 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 359 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << " \n";
	responseStream << "\t\t\t<p>Time: ";
#line 360 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "</p>\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>8. Wait ";
#line 363 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( hedera_timeout );
	responseStream << " seconds to give hedera time to process transactions</p>\n";
	responseStream << "\t\t\t";
#line 364 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!steps[6]) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 366 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else { 
				Poco::Thread::sleep(hedera_timeout * 1000); 
			   } 	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>9. Ask choosen node for transaction and print result</p>\n";
	responseStream << "\t\t\t";
#line 372 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
  time2.reset(); 
				if(!steps[7] || node_server.isNull()) { 
					responseStream << "<p>skipped</p>\n";
	responseStream << "\t\t\t";
#line 375 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else { 
				auto node_server_model = node_server->getModel();
				JsonRPCRequest jsonrpc(node_server_model->getUrl(), node_server_model->getPort());
				Poco::JSON::Object params;
				params.set("groupAlias", user_group->getModel()->getAlias());
				params.set("lastKnownSequenceNumber", 0);
				auto gn_answear = jsonrpc.request("getTransactions", params);
				if(!gn_answear.isNull()) {
					std::stringstream ss;
					Poco::JSON::Stringifier::stringify(gn_answear, ss, 4, -1, Poco::JSON_PRESERVE_KEY_ORDER); 
					std::string answear_string = ss.str(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t";
#line 386 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(answear_string) );
#line 386 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"

				}
			   } 	responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 389 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "</p>\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t</ul>\n";
	responseStream << "\t";
#line 392 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } else if(PAGE_GET_TRANSACTION_RPC_CALL == page && !node_server.isNull()) { 
		Profiler time3;
		auto node_server_model = node_server->getModel();
		auto user_group = controller::Group::load(node_server_model->getGroupId());
		JsonRPCRequest jsonrpc(node_server_model->getUrl(), node_server_model->getPort());
		Poco::JSON::Object params;
		params.set("groupAlias", user_group->getModel()->getAlias());
		params.set("lastKnownSequenceNumber", 0);
		auto gn_answear = jsonrpc.request("getTransactions", params);
		if(!gn_answear.isNull()) {
			std::stringstream ss;
			Poco::JSON::Stringifier::stringify(gn_answear, ss, 4, -1, Poco::JSON_PRESERVE_KEY_ORDER); 
			std::string answear_string = ss.str();	responseStream << "\n";
	responseStream << "\t\t\t";
#line 405 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( DataTypeConverter::replaceNewLineWithBr(answear_string) );
#line 405 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"

		}
			responseStream << "\n";
	responseStream << "\t\t<p>Time: ";
#line 408 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time3.string() );
	responseStream << "</p>\n";
	responseStream << "\t";
#line 409 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\n";
	responseStream << "</div>\n";
	responseStream << "<script type=\"text/javascript\" src=\"";
#line 412 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/js/tabs.js\"></script>\n";
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
