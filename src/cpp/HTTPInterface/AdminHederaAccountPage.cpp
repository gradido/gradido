#include "AdminHederaAccountPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"


#include "../controller/HederaAccount.h"
#include "../controller/HederaId.h"
#include "../controller/CryptoKey.h"
#include "../lib/DataTypeConverter.h"
#include "../lib/Profiler.h"
#include "../lib/Success.h"
#include "../SingletonManager/SessionManager.h"

#include "../ServerConfig.h"

#include "Poco/URI.h"

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_large.cpsp"

#include "../ServerConfig.h"


AdminHederaAccountPage::AdminHederaAccountPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminHederaAccountPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 22 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"

	const char* pageName = "Hedera Account";
	auto sm = SessionManager::getInstance();
	auto mm = MemoryManager::getInstance();
	auto user = mSession->getNewUser();
	int auto_renew_period = 604800; // 7 Tage
	int auto_renew_account = 0;
	double initial_balance = 0.0;
	Profiler hedera_time;
	std::string hedera_time_string;
	
	Poco::URI uri(request.getURI());
	auto uri_query = uri.getQueryParameters();
	std::string action = "";
	Poco::AutoPtr<controller::HederaAccount> query_hedera_account;
	
	// parsing get query params
	if(uri_query.size() >= 2) {
		if(uri_query[0].first == "action") {
			action = uri_query[0].second;
		}
		if(uri_query[1].first == "account_id") {
			std::string account_id_from_query;
			int account_id = 0;
			account_id_from_query = uri_query[1].second;
			if(DataTypeConverter::strToInt(account_id_from_query, account_id) != DataTypeConverter::NUMBER_PARSE_OKAY) {
				addError(new Error("Int Convert Error", "Error converting account_id_from_query to int"));
			} else {
				auto hedera_accounts = controller::HederaAccount::load("id", account_id);
				if(!hedera_accounts.size() || hedera_accounts[0].isNull()) {
					addError(new Error("Action", "hedera account not found"));
				} else {
				  query_hedera_account = hedera_accounts[0];
				}
			}
		}
	}
	// actions
	if(!query_hedera_account.isNull()) 
	{
		if(action == "updateBalance") 
		{
			hedera_time.reset();
			if(query_hedera_account->hederaAccountGetBalance(user)) {
				addNotification(new ParamSuccess("Hedera", "crypto get balance success in ", hedera_time.string()));
			} else {
				addError(new ParamError("Hedera", "crypto get balance failed in ", hedera_time.string()));
			}
		} 
		else if(action == "changeEncryption") 
		{
			if(query_hedera_account->changeEncryption(user)) {
				addNotification(new Success("Hedera Account", "success in changing encryption"));
			}
		}
	}
	else if(!form.empty())  // add or create 
	{
		auto creationButton = form.get("create","");
		if(creationButton != "") {
		
			// collect 
			auto auto_renew_account_string = form.get("account-auto-renew-account", "0");
			auto auto_renew_period_string = form.get("account-auto-renew-period", "604800");
			auto account_initial_balance_string = form.get("account-initial-balance", "0");
			
			if(!sm->isValid(auto_renew_account_string, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Account", "auto renew account id not an integer"));
			} else {
				if(DataTypeConverter::strToInt(auto_renew_account_string, auto_renew_account) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int convert error", "Error converting auto renew account id to int"));
				}
			}
			
			if(!sm->isValid(auto_renew_period_string, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Account", "auto renew period not an integer"));
			} else {
				if(DataTypeConverter::strToInt(auto_renew_period_string, auto_renew_period) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int convert error", "Error converting auto renew period to int"));
				}
			}
			
			if(!sm->isValid(account_initial_balance_string, VALIDATE_ONLY_DECIMAL)) {
				addError(new Error("Account", "initial balance not an decimal"));
			} else {
				if(DataTypeConverter::strToDouble(account_initial_balance_string, initial_balance) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Double convert error", "Error converting initial balance to double"));
				}
			}
			if(0 == errorCount()) 
			{
			}
			
		} else {
		
			// collect
			auto shardNumString = form.get("account-shard-num", "0");
			auto realmNumString = form.get("account-realm-num", "0");
			auto numString      = form.get("account-num", "0");
			auto privateKeyString = form.get("account-private-key", "");
			auto privateKeyEncryptedString = form.get("account-private-key-encrypted", "false");
			auto publicKeyString = form.get("account-public-key", "");
			auto networkTypeString = form.get("account-network-type", "0");
			
			//printf("private key encrypted: %s\n", privateKeyEncryptedString.data());
			
			int shardNum = 0;
			int realmNum = 0;
			int num = 0;
			int networkType = 0;
			
			MemoryBin* private_key = nullptr;
			MemoryBin* public_key = nullptr;
			
			// validate
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
			if(!sm->isValid(privateKeyString, VALIDATE_ONLY_HEX)) {
				addError(new Error("Account Keys", "private key not hex"));
			}
			if(!sm->isValid(publicKeyString, VALIDATE_ONLY_HEX)) {
				addError(new Error("Account Keys", "public key not hex"));
			}
			if(!sm->isValid(networkTypeString, VALIDATE_ONLY_INTEGER)) {
				addError(new Error("Network Type", "not integer"));
			} else {
				if(DataTypeConverter::strToInt(networkTypeString, networkType) != DataTypeConverter::NUMBER_PARSE_OKAY) {
					addError(new Error("Int Convert Error", "Error converting network type to int"));
				}
				if(networkType < 0 || networkType >= (int)model::table::HEDERA_NET_COUNT) {
					addError(new Error("Network Type", "invalid value"));
				}
			}
			
			if(0 == errorCount()) {
			
				auto hedera_id = controller::HederaId::create(shardNum, realmNum, num);
				
				private_key = DataTypeConverter::hexToBin(privateKeyString);
				public_key  = DataTypeConverter::hexToBin(publicKeyString);
				
				
				KeyPairHedera key_pair(private_key, public_key);
				auto crypto_key = controller::CryptoKey::load(key_pair.getPublicKey(), ed25519_pubkey_SIZE);
				
				if(crypto_key.isNull()) {
					crypto_key = controller::CryptoKey::create(&key_pair, user, privateKeyEncryptedString == "true");
					if(!crypto_key->getModel()->insertIntoDB(true)) {
						addError(new Error("DB Error", "Error saving crypto key in DB"));
					}
				} else {
					printf("crypto key found in db\n");
				}
				if(0 == errorCount()) {
					
					if(hedera_id->isExistInDB()) {
						auto hedera_account = controller::HederaAccount::load(hedera_id);
						if(hedera_account.isNull()) {
							addError(new Error("DB Error", "Couldn't load hedera account from db, but it should exist"));
						} else {
							addError(new Error("Hedera Account", "Account already exist (same account id"));
						}
						
					} else {
						auto hedera_account = controller::HederaAccount::create(
							user->getModel()->getID(),
							hedera_id->getModel()->getID(),
							crypto_key->getModel()->getID(),
							0,
							(model::table::HederaNetworkType)networkType
						);
						if(!hedera_account->getModel()->insertIntoDB(false)) {
							addError(new Error("DB Error", "Error saving hedera account into DB"));
						}
					}
				}
				
				mm->releaseMemory(private_key);
				mm->releaseMemory(public_key);
			}
		}
	}	
	if(!query_hedera_account.isNull()) {
		getErrors(query_hedera_account);
	}
	// list accounts
	auto hedera_accounts = controller::HederaAccount::load("user_id", user->getModel()->getID());
	
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
#line 238 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"content-list\">\n";
	responseStream << "\t\t<div class=\"content-list-title\">\n";
	responseStream << "\t\t\t<h2>Deine Hedera Accounts</h2>\n";
	responseStream << "\t\t</div>\t\n";
	responseStream << "\t\t<div class=\"content-list-table\">\n";
	responseStream << "\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Hedera Id</div>\t\t\t\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Balance</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Server Type</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Verschlüsselt?</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Last Updated</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c5\">Aktionen</div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 254 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 for(auto it = hedera_accounts.begin(); it != hedera_accounts.end(); it++) {
					auto hedera_account_model = (*it)->getModel();  
					auto updateUrl = ServerConfig::g_serverPath + "/hedera_account?action=updateBalance&account_id=" + std::to_string(hedera_account_model->getID());
					std::string changeEncryption("");
					if(hedera_account_model->getUserId() == user->getModel()->getID()) {
						changeEncryption = ServerConfig::g_serverPath + "/hedera_account?action=changeEncryption&account_id=" + std::to_string(hedera_account_model->getID());
					}
					auto isEncrypted = (*it)->getCryptoKey()->getModel()->isEncrypted();
					//printf("change encryption: %s\n", changeEncryption.data());
						responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 265 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( (*it)->getHederaId()->getModel()->toString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 266 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( hedera_account_model->getBalanceString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 267 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( model::table::HederaAccount::hederaNetworkTypeToString(hedera_account_model->getNetworkType()) );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3 ";
#line 268 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( isEncrypted ? "success-color" : "alert-color");
	responseStream << "\">";
#line 268 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( isEncrypted ? "Ja": "Nein" );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 269 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( hedera_account_model->getUpdatedString() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c5\">\n";
	responseStream << "\t\t\t\t\t\t<button class=\"form-button\" title=\"Anfrage an Hedera, aktuell kostenlos\" onclick=\"window.location.href='";
#line 271 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( updateUrl );
	responseStream << "'\"  >\n";
	responseStream << "\t\t\t\t\t\t\tUpdate Balance\n";
	responseStream << "\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t\t";
#line 274 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 if(changeEncryption != "") { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<button class=\"form-button\" title=\"Ändere den Verschlüsselungsstatus des Private Keys in der Datenbank\" onclick=\"window.location.href='";
#line 275 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( changeEncryption );
	responseStream << "'\">\n";
	responseStream << "\t\t\t\t\t\t\t\tChange Encryption\n";
	responseStream << "\t\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t\t";
#line 278 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 281 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Ein existierenden Account eintragen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\" action=\"";
#line 288 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/hedera_account\">\n";
	responseStream << "\t\t\t<label class=\"form-label\">Hedera Account ID</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-shard-num\" placeholder=\"shard\" type=\"number\" name=\"account-shard-num\"/>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-realm-num\" placeholder=\"realm\" type=\"number\" name=\"account-realm-num\"/>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-num\" placeholder=\"num\" type=\"number\" name=\"account-num\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-private-key\">Private Key</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-private-key\" type=\"text\" name=\"account-private-key\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-private-key-encrypted\" title=\"Wenn er verschlüsselt ist, kannst nur du Hedera Transaktionen damit bezahlen, wenn er nicht verschlüsselt ist kann er für alle Hedera Transaktionen automatisch verwendet werden. Ich empfehle dafür ein separates Konto mit wenigen Hashbars anzulegen.\">Private Key verschlüsseln?</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-private-key-encrypted\" type=\"checkbox\" name=\"account-private-key-encrypted\" value=\"true\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-public-key\">Public Key</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-public-key\" type=\"text\" name=\"account-public-key\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-network-type\">Network Type</label>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"account-network-type\" id=\"account-network-type\">\n";
	responseStream << "\t\t\t";
#line 301 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 for(int i = 0; i < model::table::HEDERA_NET_COUNT; i++) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<option value=\"";
#line 302 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( i );
	responseStream << "\">";
#line 302 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( model::table::HederaAccount::hederaNetworkTypeToString((model::table::HederaNetworkType)i) );
	responseStream << "</option>\n";
	responseStream << "\t\t\t";
#line 303 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"add\" value=\"";
#line 305 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( gettext("Add Account") );
	responseStream << "\">\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t\t<h3>Ein neuen Account anlegen</h3>\n";
	responseStream << "\t\t<p>Bei Hedera einen neuen Account anlegen und zum Start Hashbars von einem existierenden Account überweisen.</p>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\" action=\"";
#line 313 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/hedera_account\">\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-auto-renew-account\">Auto Renew and Founding Hedera Account</label>\n";
	responseStream << "\t\t\t<select name=\"account-auto-renew-account\" id=\"account-auto-renew-account\">\n";
	responseStream << "\t\t\t\t";
#line 316 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 for(auto it = hedera_accounts.begin(); it != hedera_accounts.end(); it++) { 
					auto model = (*it)->getModel();
					responseStream << "\n";
	responseStream << "\t\t\t\t\t<option title=\"";
#line 319 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( model->toString() );
	responseStream << "\" value=\"";
#line 319 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( model->getID() );
	responseStream << "\" ";
#line 319 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 if(auto_renew_account == model->getID()) {	responseStream << "selected=\"selected\"";
#line 319 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << ">";
#line 319 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( (*it)->toShortSelectOptionName() );
	responseStream << "</option>\n";
	responseStream << "\t\t\t\t";
#line 320 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-auto-renew-period\">Auto Renew Period in seconds</label>\n";
	responseStream << "\t\t\t<div><input class=\"form-control input-40\" id=\"account-auto-renew-period\" value=\"";
#line 323 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( auto_renew_period );
	responseStream << "\" type=\"number\" name=\"account-auto-renew-period\"/><span style=\"margin-left:8px\" id=\"readable-auto-renew-period\"></span><div>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-initial-balance\">Initial Balance for new Account (taken from founding account)</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-initial-balance\" name=\"account-initial-balance\" type=\"number\" step=\"0.00000001\" value=\"";
#line 325 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( std::to_string(initial_balance) );
	responseStream << "\" />\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"create\" value=\"";
#line 326 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( gettext("Create Account") );
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
#line 331 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/js/time_calculations.js\"></script>\n";
	responseStream << "<script type=\"text/javascript\">\n";
	responseStream << "\tvar input = document.getElementById(\"account-auto-renew-period\");\n";
	responseStream << "\tvar span = document.getElementById(\"readable-auto-renew-period\");\n";
	responseStream << "\tspan.innerHTML = '~ ' + getExactTimeDuration(input.value);\n";
	responseStream << "\tinput.addEventListener('keyup', function(e) {\n";
	responseStream << "\t\tspan.innerHTML = '~ ' + getExactTimeDuration(input.value);\n";
	responseStream << "\t});\n";
	responseStream << "\t\n";
	responseStream << "</script>\n";
	if (_compressResponse) _gzipStream.close();
}
