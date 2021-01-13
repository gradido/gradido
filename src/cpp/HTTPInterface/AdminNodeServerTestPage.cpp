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
#include "../model/gradido/Transaction.h"

#include "Poco/Thread.h"

enum PageType
{
	PAGE_CHOOSE_TEST,
	PAGE_RUN_4_SET_TEST
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
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"

	const char* pageName = "Node Server Test";
	PageType page = PAGE_CHOOSE_TEST;
	Poco::AutoPtr<controller::NodeServer> node_server;
	Poco::AutoPtr<controller::User> user;
	Poco::AutoPtr<controller::HederaTopic> hedera_topic;
	int hedera_timeout = 15;
	
	
	if(!form.empty()) 
	{
		auto node_server_id_string = form.get("test-node-servers", "");
		if(node_server_id_string != "") {
			int node_server_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(node_server_id_string, node_server_id )) {
				node_server = controller::NodeServer::load(node_server_id);
			}
		}
		auto topic_id_string = form.get("test-hedera-topic", "");
		if(topic_id_string != "") {
			int topic_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(topic_id_string, topic_id)) {
				hedera_topic = controller::HederaTopic::load(topic_id);
			}
		}
		auto test_timeout_string = form.get("test-timeout", "");
		if(test_timeout_string != "") {
			DataTypeConverter::strToInt(test_timeout_string, hedera_timeout);
		}
		auto submit = form.get("submit", "");
		if(submit == "Run 4-Test") {
			page = PAGE_RUN_4_SET_TEST;
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
#line 63 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<!-- Tab links -->\n";
	responseStream << "\t<div class=\"tab\">\n";
	responseStream << "\t  <button class=\"tablinks\" onclick=\"openTab(event, 'test-4')\">Test 4-Set (2 AddMember, Creation, Transfer)</button>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div id=\"test-4\" class=\"tabcontent\">\n";
	responseStream << "\t\t<div class=\"center-form-title\">\n";
	responseStream << "\t\t\t<h3>Test 4-Set (2 AddMember, Creation, Transfer)</</h3>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t\t<p>1. Create two new accounts and show user public keys for comparisation</p>\n";
	responseStream << "\t\t\t<p>2. Send a add-member transaction to hedera topic with one signature (first user)</p>\n";
	responseStream << "\t\t\t<p>3. Send a add-member transaction to hedera topic with two signatures (first user and second user)</p>\n";
	responseStream << "\t\t\t<p>4. Send a creation transaction to second user, signed by first user</p>\n";
	responseStream << "\t\t\t<p>5. Send a transfer transaction from second user to first user signed by second user</p>\n";
	responseStream << "\t\t\t<p>6. Wait x seconds to give hedera time to process transactions</p>\n";
	responseStream << "\t\t\t<p>7. Ask choosen node for transaction and print result</p>\n";
	responseStream << "\t\t\t<form method=\"POST\" action=\"";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/adminNodeServerTest\">\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"test-node-servers\">Node Server for tests</label>\n";
	responseStream << "\t\t\t\t";
#line 83 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(node_servers.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<a href=\"";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/nodes\"><span class=\"link-title\">Edit Node-Servers</span></a>\n";
	responseStream << "\t\t\t\t";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t<select name=\"test-node-servers\" id=\"test-node-servers\">\n";
	responseStream << "\t\t\t\t\t";
#line 87 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = node_servers.begin(); it != node_servers.end(); it++) { 
						auto model = (*it)->getModel();
						responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<option title=\"";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!node_server.isNull() && node_server->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getUrlWithPort() );
	responseStream << ", group: ";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"test-hedera-topic\">Hedera Topic for tests</label>\n";
	responseStream << "\t\t\t\t";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(hedera_topics.size() == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<a href=\"";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/topic\"><span class=\"link-title\">Edit Hedera-Topics</span></a>\n";
	responseStream << "\t\t\t\t";
#line 96 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t<select name=\"test-hedera-topic\" id=\"test-hedera-topic\">\n";
	responseStream << "\t\t\t\t\t";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 for(auto it = hedera_topics.begin(); it != hedera_topics.end(); it++) { 
						auto model = (*it)->getModel();
						auto hedera_account = (*it)->getAutoRenewAccount();
						if(hedera_account->getModel()->getNetworkType() != ServerConfig::HEDERA_TESTNET) {
							continue;
						}
						responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<option title=\"";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(!hedera_topic.isNull() && hedera_topic->getModel()->getID() == model->getID()) {	responseStream << "selected=\"selected\"";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << ">";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getName() );
	responseStream << ", group: ";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( model->getGroupId() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t\t";
#line 106 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</select>\n";
	responseStream << "\t\t\t\t<label class=\"form-label\" for=\"test-timeout\">Timeout waiting for hedera in seconds</label>\n";
	responseStream << "\t\t\t\t<input name=\"test-timeout\" id=\"test-timeout\" type=\"number\" value=\"";
#line 109 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( hedera_timeout );
	responseStream << "\"> seconds \n";
	responseStream << "\t\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"Run 4-Test\">\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 if(PAGE_RUN_4_SET_TEST == page && !hedera_topic.isNull() && !node_server.isNull()) { 	responseStream << "\n";
	responseStream << "\t<ul>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>1. Create two new accounts and show user public keys for comparisation: </p>\n";
	responseStream << "\t\t\t";
#line 118 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			Profiler time2;
			auto group_id = hedera_topic->getModel()->getGroupId();
			auto user_group = controller::Group::load(group_id);
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
				responseStream << "\t\t\t\n";
	responseStream << "\t\t\t<p>User 1: ";
#line 138 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_1->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p>User 2: ";
#line 139 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( user_2->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p>Time: ";
#line 140 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>2. Send a add-member transaction to hedera topic with one signature (first user)</p>\n";
	responseStream << "\t\t\t";
#line 144 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset(); 
			{
				auto transaction1 = model::gradido::Transaction::createGroupMemberUpdate(user_1, user_group);
				transaction1->getTransactionBody()->getGroupMemberUpdate()->setMinSignatureCount(1);
				transaction1->sign(user_1);
			}
				responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t\t<li>\n";
	responseStream << "\t\t\t<p>3. Send a add-member transaction to hedera topic with two signatures (first user and second user)</p>\n";
	responseStream << "\t\t\t";
#line 156 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 
			time2.reset();  
			{
				auto transaction2 = model::gradido::Transaction::createGroupMemberUpdate(user_2, user_group);
				transaction2->getTransactionBody()->getGroupMemberUpdate()->setMinSignatureCount(2);
				transaction2->sign(user_2);
				transaction2->sign(user_1);
			}
			
				responseStream << "\n";
	responseStream << "\t\t\t<p>Time: ";
#line 166 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
	responseStream << ( time2.string() );
	responseStream << "\n";
	responseStream << "\t\t</li>\n";
	responseStream << "\t</ul>\n";
	responseStream << "\t";
#line 169 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\n";
	responseStream << "</div>\n";
	responseStream << "<script type=\"text/javascript\" src=\"";
#line 172 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminNodeServerTest.cpsp"
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
