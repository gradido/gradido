#include "DecodeTransactionPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"

#include "sodium.h"
#include "../proto/gradido/TransactionBody.pb.h"
#include "../controller/User.h"
#include "../model/TransactionBase.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


DecodeTransactionPage::DecodeTransactionPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void DecodeTransactionPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"

	const char* pageName = "Decode Transaction";
	model::messages::gradido::TransactionBody transactionBody;
	bool decoded = false;
	bool adminUser = false;
	if(mSession && mSession->getNewUser())  {
		auto user = mSession->getNewUser();
		auto model = user->getModel();
		if(model && model->getRole() == model::table::ROLE_ADMIN) {
			adminUser = true;
		}
	}
	if(!form.empty()) {
		auto base64 = form.get("transaction", "");
		if(base64 != "") {
			unsigned char* binBuffer = (unsigned char*)malloc(base64.size());
			size_t resultingBinSize = 0;
			size_t base64_size = base64.size();
			bool encodingValid = false;
			if (!sodium_base642bin(
				binBuffer, base64_size,
				base64.data(), base64_size, 
				nullptr, &resultingBinSize, nullptr, 
				sodium_base64_VARIANT_ORIGINAL)) 
			{
				encodingValid = true;
			} else if(!sodium_base642bin(
  					  binBuffer, base64_size, 
					  base64.data(), base64_size,
					  nullptr, &resultingBinSize, nullptr,
					  sodium_base64_VARIANT_URLSAFE_NO_PADDING)) {
				  //encodingValid = true;
				  //free(binBuffer);
				  addError(new Error("ProcessingTransaction", "it is maybe a Transaction, but I support only TransactionBodys"), false);
			}
			if(false == encodingValid) {
				free(binBuffer);
				addError(new Error("ProcessingTransaction", "error decoding base64"), false);
			} else {
				std::string binString((char*)binBuffer, resultingBinSize);
				free(binBuffer);
				
				if (!transactionBody.ParseFromString(binString)) {
					addError(new Error("ProcessingTransaction", "error creating Transaction from binary Message"), false);			
				} else {
					decoded = true;
				}
			}
			
		}
	} 
	/*
	char *sodium_bin2hex(char * const hex, const size_t hex_maxlen,
                     const unsigned char * const bin, const size_t bin_len);
	*/
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_old.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
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
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 53 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	// end include header_old.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Transaktion dekodieren</h1>\n";
	responseStream << "\t";
#line 71 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Transaktion dekodieren</legend>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"transaction\">";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( !form.empty() ? form.get("transaction", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed\" type=\"submit\" name=\"submit\" value=\"Dekodieren\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 79 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 if(decoded) { 	responseStream << "\n";
	responseStream << "\t\t<p><b>Verwendungszweck:</b></p>\n";
	responseStream << "\t\t<p>";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( transactionBody.memo() );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 if(transactionBody.has_transfer()) { 
			auto transfer = transactionBody.transfer();
			responseStream << "\n";
	responseStream << "\t\t<h3>Transfer</h3>\n";
	responseStream << "\t\t<b>Sender</b>\n";
	responseStream << "\t\t";
#line 87 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 for(int i = 0; i < transfer.senderamounts_size(); i++) {
			auto sender = transfer.senderamounts(i); 
			char hex[65]; memset(hex, 0, 65);
			sodium_bin2hex(hex, 65, (const unsigned char*)sender.ed25519_sender_pubkey().data(), sender.ed25519_sender_pubkey().size());
				responseStream << "\n";
	responseStream << "\t\t\t<p>pubkey: ";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( hex );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p>amount: ";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << (  TransactionBase::amountToString(sender.amount()) );
	responseStream << " GDD</p>\n";
	responseStream << "\t\t";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t<b>Receiver</b>\n";
	responseStream << "\t\t";
#line 96 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 for(int i = 0; i < transfer.receiveramounts_size(); i++) {
			auto receiver = transfer.receiveramounts(i); 
			char hex[65]; memset(hex, 0, 65);
			sodium_bin2hex(hex, 65, (const unsigned char*)receiver.ed25519_receiver_pubkey().data(), receiver.ed25519_receiver_pubkey().size());
				responseStream << "\n";
	responseStream << "\t\t\t<p>pubkey: ";
#line 101 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( hex );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p>amount: ";
#line 102 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << (  TransactionBase::amountToString(receiver.amount()) );
	responseStream << " GDD</p>\n";
	responseStream << "\t\t";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } else if(transactionBody.has_creation()) { 
			auto creation = transactionBody.creation();
			auto receiver = creation.receiveramount();
			char hex[65]; memset(hex, 0, 65);
			sodium_bin2hex(hex, 65, (const unsigned char*)receiver.ed25519_receiver_pubkey().data(), receiver.ed25519_receiver_pubkey().size());
			
			Poco::AutoPtr<controller::User> user = nullptr;
			if(adminUser) {
				user = controller::User::create();
				if(!user->load((const unsigned char*)receiver.ed25519_receiver_pubkey().data())) {
					user.assign(nullptr);
				}
			}
			//pubkey
			responseStream << "\n";
	responseStream << "\t\t<h3>Creation</h3>\n";
	responseStream << "\t\t";
#line 120 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 if(!adminUser || user.isNull() || !user->getModel()) { 	responseStream << "\n";
	responseStream << "\t\t<p>pubkey: ";
#line 121 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( hex );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 122 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t<p>user: </p>\n";
	responseStream << "\t\t<p>";
#line 124 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( user->getModel()->toHTMLString() );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t<p>amount: ";
#line 126 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
	responseStream << ( TransactionBase::amountToString(receiver.amount()) );
	responseStream << " GDD</p>\n";
	responseStream << "\t\t";
#line 127 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 128 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\decodeTransaction.cpsp"
 } 	responseStream << "\n";
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
	if (_compressResponse) _gzipStream.close();
}
