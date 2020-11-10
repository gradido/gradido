#include "AdminTopicPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	#include "../controller/HederaAccount.h"
	#include "../controller/HederaTopic.h"
	#include "../controller/Group.h"
	#include "../SingletonManager/SessionManager.h"
	#include "../ServerConfig.h"
	
	#include "../lib/DataTypeConverter.h"
	#include "../lib/Profiler.h"
	#include "../lib/Success.h"
	
	#include "Poco/Timespan.h"
	#include "Poco/URI.h"
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
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"

	const char* pageName = "Topic";
	auto user = mSession->getNewUser();
	auto sm = SessionManager::getInstance();
	Profiler hedera_time;
	
	std::string name = "";
	int auto_renew_account = 0;
	int auto_renew_period = 604800; // 7 Tage
	
	int group_id = 0;
	
	Poco::URI uri(request.getURI());
	auto uri_query = uri.getQueryParameters();
	std::string action = "";
	Poco::AutoPtr<controller::HederaTopic> query_hedera_topic;
	
	// parsing get query params
	if(uri_query.size() >= 2) {
		if(uri_query[0].first == "action") {
			action = uri_query[0].second;
		}
		if(uri_query[1].first == "topic_id") {
			std::string topic_id_from_query;
			int topic_id = 0;
			topic_id_from_query = uri_query[1].second;
			if(DataTypeConverter::strToInt(topic_id_from_query, topic_id) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int Convert Error", "Error converting topic_id_from_query to int"));
			} else {
				auto hedera_topic = controller::HederaTopic::load(topic_id);
				if(hedera_topic.isNull()) {
					addError(new Error("Action", "hedera topic not found"));
				} else {
				  query_hedera_topic = hedera_topic;
				}
			}
		}
	}
	// actions
	if(!query_hedera_topic.isNull()) 
	{
		if(action == "getTopicInfos") 
		{
			hedera_time.reset();
			if(query_hedera_topic->updateWithGetTopicInfos(user)) {
				addNotification(new ParamSuccess("Hedera", "hedera get topic infos success in ", hedera_time.string()));
			} else {
				addError(new ParamError("Hedera", "hedera get topic infos failed in ", hedera_time.string()));
			}
			getErrors(query_hedera_topic);
		} 
	}
	else if(!form.empty()) 
	{
		name = form.get("topic-name", "");
		auto auto_renew_account_string = form.get("topic-auto-renew-account", "0");
		auto auto_renew_period_string = form.get("topic-auto-renew-period", "604800");
		auto group_id_string = form.get("topic-group", "-1");
		
		if(name != "" && !sm->isValid(name, VALIDATE_NAME)) {
			addError(new Error("Topic", "Name not valid, at least 3 Character"));
		}
		
		if(!sm->isValid(auto_renew_account_string, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Topic", "auto renew account id not an integer"));
		} else {
			if(DataTypeConverter::strToInt(auto_renew_account_string, auto_renew_account) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int convert error", "Error converting auto renew account id to int"));
			}
		}
		
		if(!sm->isValid(auto_renew_period_string, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Topic", "auto renew period not an integer"));
		} else {
			if(DataTypeConverter::strToInt(auto_renew_period_string, auto_renew_period) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int convert error", "Error converting auto renew period to int"));
			}
		}
	
		if(!sm->isValid(group_id_string, VALIDATE_ONLY_INTEGER)) {
			addError(new Error("Topic", "group_id not an integer"));
		} else {
			if(DataTypeConverter::strToInt(group_id_string, group_id) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int convert error", "Error converting group_id to int"));
			}
		}
		//const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId

		auto hedera_topic = controller::HederaTopic::create(name, auto_renew_account, auto_renew_period, group_id); 
		if(!hedera_topic->getModel()->insertIntoDB(true)) {
			addError(new Error("Topic", "error saving into db"));
		} else {
			auto payer = controller::HederaAccount::load(auto_renew_account);
			if(payer.isNull()) {
				addError(new Error("Payer", "payer account not found"));
			} else {
				auto hedera_task = hedera_topic->createTopic(payer, user);
				if(hedera_task.isNull()) {
					addError(new Error("Create Topic", "Failed"));
					getErrors(hedera_topic);
				}
			}
		}

		
	}
	
	
	auto hedera_accounts = controller::HederaAccount::load("user_id", user->getModel()->getID());
	//std::vector<Poco::AutoPtr<controller::HederaAccount>> hedera_accounts;
	
	auto groups = controller::Group::listAll();
	std::map<int, int> group_indices;
	int count = 0;
	for(auto it = groups.begin(); it != groups.end(); it++) {
		group_indices.insert(std::pair<int, int>((*it)->getModel()->getID(), count));
		count++;
	}
	
	auto hedera_topics = controller::HederaTopic::listAll();
	//std::vector<Poco::AutoPtr<controller::HederaTopic>> hedera_topics;
	
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
	responseStream << "<style type=\"text/css\">\n";
	responseStream << "\t.center-form-form .input-40 {\n";
	responseStream << "\t\tmargin-left:0;\n";
	responseStream << "\t\twidth:40%;\n";
	responseStream << "\t\tdisplay:inline-block;\n";
	responseStream << "\t}\n";
	responseStream << "\t\n";
	responseStream << "</style>\n";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"content-container info-container\">\n";
	responseStream << "\t<h1>Topic Admin Page</h1>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"content-list\">\n";
	responseStream << "\t\t<div class=\"content-list-title\">\n";
	responseStream << "\t\t\t<h2>Hedera Topics</h2>\n";
	responseStream << "\t\t</div>\t\n";
	responseStream << "\t\t<div class=\"content-list-table\">\n";
	responseStream << "\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Topic ID</div>\t\t\t\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Name</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Network Type</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c4\">Auto Renew Account Balance</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c4\">Auto Renew Period</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Group ID</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Current Timeout</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Sequence Number</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\" title=\"Last Time Get update from Hedera\">Last Updated</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c5\">Aktionen</div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 174 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 for(auto it = hedera_topics.begin(); it != hedera_topics.end(); it++) {
					auto hedera_topic_model = (*it)->getModel();  
					auto updateUrl = ServerConfig::g_serverPath + "/topic?action=getTopicInfos&topic_id=" + std::to_string(hedera_topic_model->getID());
					auto auto_renew_account = (*it)->getAutoRenewAccount();
					auto renew_account_model = auto_renew_account->getModel();
					std::string timeout_color = "success-color";
					if(hedera_topic_model->getCurrentTimeout() < Poco::DateTime()) {
						timeout_color = "alert-color";
					} else if((hedera_topic_model->getCurrentTimeout() - Poco::DateTime()) < Poco::Timespan(2,0,0,0,0)) {
						timeout_color = "orange-color";
					}
					std::string topic_hedera_id_string = "";
					auto topic_hedera_id = (*it)->getTopicHederaId();
					if(!topic_hedera_id.isNull()) {
						topic_hedera_id_string = topic_hedera_id->getModel()->toString();
					}
					
						responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 193 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( topic_hedera_id_string );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 194 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getName() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 195 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( model::table::HederaAccount::hederaNetworkTypeToString(renew_account_model->getNetworkType()) );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c4\">";
#line 196 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( renew_account_model->getBalanceString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c4\">";
#line 197 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getAutoRenewPeriodString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 198 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getGroupId() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3 ";
#line 199 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( timeout_color );
	responseStream << "\">";
#line 199 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getCurrentTimeoutString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getSequenceNumber() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 201 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( hedera_topic_model->getUpdatedString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c5\">";
#line 202 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 if(!topic_hedera_id.isNull()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<button class=\"form-button\" title=\"Query on Hedera, cost some fees\" onclick=\"window.location.href='";
#line 203 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( updateUrl );
	responseStream << "'\"  >\n";
	responseStream << "\t\t\t\t\t\t\tget topic infos\n";
	responseStream << "\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t\t";
#line 206 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 209 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Ein neues Topic anlegen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\" action=\"";
#line 216 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/topic\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-name\">Name</label>\n";
	responseStream << "\t\t\t<input type=\"text\" class=\"form-control\" id=\"topic-name\" name=\"topic-name\" value=\"";
#line 218 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( name );
	responseStream << "\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-auto-renew-account\">Auto Renew Hedera Account</label>\n";
	responseStream << "\t\t\t<select name=\"topic-auto-renew-account\" id=\"topic-auto-renew-account\">\n";
	responseStream << "\t\t\t\t";
#line 221 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 for(auto it = hedera_accounts.begin(); it != hedera_accounts.end(); it++) { 
					auto model = (*it)->getModel();
					responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 224 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 224 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 224 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 if(auto_renew_account == model->getID()) {	responseStream << "selected=\"selected\"";
#line 224 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << ">";
#line 224 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( (*it)->toShortSelectOptionName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 225 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-auto-renew-period\">Auto Renew Period in seconds</label>\n";
	responseStream << "\t\t\t<div><input class=\"form-control input-40\" id=\"topic-auto-renew-period\" value=\"";
#line 228 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( auto_renew_period );
	responseStream << "\" type=\"number\" name=\"topic-auto-renew-period\"/><span style=\"margin-left:8px\" id=\"readable-auto-renew-period\"></span><div>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"topic-group\">Group</label>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"topic-group\" id=\"topic-group\">\t\t\t\n";
	responseStream << "\t\t\t\t<option value=\"-1\">Keine Gruppe</option>\n";
	responseStream << "\t\t\t\t";
#line 232 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) { 
					auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "\" value=\"";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getID() );
	responseStream << "\" ";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 if(group_id == group_model->getID()) {	responseStream << "selected=\"selected\"";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << ">";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 235 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"";
#line 238 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
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
#line 243 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminTopic.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/js/time_calculations.js\"></script>\n";
	responseStream << "<script type=\"text/javascript\">\n";
	responseStream << "\tvar input = document.getElementById(\"topic-auto-renew-period\");\n";
	responseStream << "\tvar span = document.getElementById(\"readable-auto-renew-period\");\n";
	responseStream << "\tspan.innerHTML = '~ ' + getExactTimeDuration(input.value);\n";
	responseStream << "\tinput.addEventListener('keyup', function(e) {\n";
	responseStream << "\t\tspan.innerHTML = '~ ' + getExactTimeDuration(input.value);\n";
	responseStream << "\t});\n";
	responseStream << "\t\n";
	responseStream << "</script>";
	if (_compressResponse) _gzipStream.close();
}
