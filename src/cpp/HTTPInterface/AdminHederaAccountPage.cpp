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
#include "../SingletonManager/SessionManager.h"

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
#line 16 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"

	const char* pageName = "Hedera Account";
	auto sm = SessionManager::getInstance();
	auto mm = MemoryManager::getInstance();
	auto user = mSession->getNewUser();
	
	// add 
	if(!form.empty()) {
		// collect
		auto shardNumString = form.get("account-shard-num", "0");
		auto realmNumString = form.get("account-realm-num", "0");
		auto numString      = form.get("account-num", "0");
		auto privateKeyString = form.get("account-private-key", "");
		auto publicKeyString = form.get("account-public-key", "");
		auto networkTypeString = form.get("account-network-type", "0");
		
		int shardNum = 0;
		int realmNum = 0;
		int num = 0;
		int networkType = 0;
		
		MemoryBin* privateKey = nullptr;
		MemoryBin* publicKey = nullptr;
		
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
			if(!hedera_id->getModel()->insertIntoDB(true)) {
				addError(new Error("DB Error", "Error saving hedera id in DB"));
			}
			
			privateKey = DataTypeConverter::hexToBin(privateKeyString);
			publicKey  = DataTypeConverter::hexToBin(publicKeyString);
			
			
			KeyPairHedera key_pair(privateKey, publicKey);
			mm->releaseMemory(privateKey);
			mm->releaseMemory(publicKey);
			auto crypto_key = controller::CryptoKey::create(&key_pair, user);
			if(!crypto_key->getModel()->insertIntoDB(true)) {
				addError(new Error("DB Error", "Error saving crypto key in DB"));
			}
			
			if(0 == errorCount()) {
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
		
	}	

	
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
	responseStream << "\t\t<div class=\"content\">";
	// end include header_large.cpsp
	responseStream << "\n";
#line 116 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"center-form-container\">\n";
	responseStream << "\t<div class=\"center-form-title\">\n";
	responseStream << "\t    <h3>Einen neuen Account anlegen</h3>\n";
	responseStream << "\t</div>\n";
	responseStream << "\t<div class=\"center-form-form\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<label class=\"form-label\">Hedera Account ID</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-shard-num\" placeholder=\"shard\" type=\"number\" name=\"account-shard-num\"/>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-realm-num\" placeholder=\"realm\" type=\"number\" name=\"account-realm-num\"/>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-num\" placeholder=\"num\" type=\"number\" name=\"account-num\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-private-key\">Private Key</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-private-key\" type=\"text\" name=\"account-private-key\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-public-key\">Public Key</label>\n";
	responseStream << "\t\t\t<input class=\"form-control\" id=\"account-public-key\" type=\"text\" name=\"account-public-key\"/>\n";
	responseStream << "\t\t\t<label class=\"form-label\" for=\"account-network-type\">Network Type</label>\n";
	responseStream << "\t\t\t<select class=\"form-control\" name=\"account-network-type\" id=\"account-network-type\">\n";
	responseStream << "\t\t\t";
#line 133 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 for(int i = 0; i < model::table::HEDERA_NET_COUNT; i++) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<option value=\"";
#line 134 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( i );
	responseStream << "\">";
#line 134 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( model::table::HederaAccount::hederaNetworkTypeToString((model::table::HederaNetworkType)i) );
	responseStream << "</option>\n";
	responseStream << "\t\t\t";
#line 135 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</select>\n";
	responseStream << "\t\t\t<input class=\"center-form-submit form-button\" type=\"submit\" name=\"submit\" value=\"";
#line 137 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminHederaAccount.cpsp"
	responseStream << ( gettext("Add Account") );
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
