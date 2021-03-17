#include "PassphrasedTransaction.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"

#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/SessionManager.h"
#include "../Crypto/KeyPair.h"
#include "../ServerConfig.h"

#include "Poco/JSON/Object.h"
#include "Poco/JSON/Parser.h"
#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

enum PageState {
	PAGE_STATE_INPUT,
	PAGE_STATE_SUCCESS
};
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


void PassphrasedTransaction::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
 
	std::string pageName = "Gradidos mit Passphrase überweisen";	
	PageState state = PAGE_STATE_INPUT;
	Mnemonic* wordSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER];
	auto sm = SessionManager::getInstance();
	auto mm = MemoryManager::getInstance();
	std::string errorString ="";
	
	if(!form.empty()) {
		auto passphrase = form.get("passphrase", "");
		bool passphraseValid = User::validatePassphrase(passphrase, &wordSource);
		bool keysGenerated = false;
		KeyPair keys; 
		if(!passphraseValid) 
		{
			addError(new Error("Passphrase", "Fehler beim validieren der Passphrase"));
		}  
		else 
		{
			keysGenerated = keys.generateFromPassphrase(passphrase.data(), wordSource);
			if(!keysGenerated) 
			{
				addError(new Error("Passphrase", "Konnte keine Keys aus der Passphrase generieren"));
			} 
		}
		if(passphraseValid && keysGenerated)
		{
			// create session only for transaction
			int session_id = 0;
			auto session = sm->getNewSession(&session_id);
			// create payload
			Poco::JSON::Object requestJson;
			Poco::JSON::Object pubkeys;
			pubkeys.set("sender", keys.getPubkeyHex());
			pubkeys.set("receiver", form.get("recevier", ""));
			requestJson.set("method", "moveTransaction");
			requestJson.set("pubkeys", pubkeys);
			requestJson.set("memo", form.get("memo", ""));
			requestJson.set("session_id", session_id);
			
			printf("[PassphrasedTransaction] prepare request\n");
			
			// send to php server
			Poco::Net::HTTPSClientSession httpsClientSession(ServerConfig::g_php_serverHost, 443);
			Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_POST, "/JsonRequestHandler");

			request.setChunkedTransferEncoding(true);
			std::ostream& requestStream = httpsClientSession.sendRequest(request);
			requestJson.stringify(requestStream);

			Poco::Net::HTTPResponse response;
			std::istream& request_stream = httpsClientSession.receiveResponse(response);
			
			std::stringstream responseStringStream;
			for (std::string line; std::getline(request_stream, line); ) {
				responseStringStream << line << std::endl;
			}
			
			// extract parameter from request
			Poco::JSON::Parser jsonParser;
			Poco::Dynamic::Var parsedJson;
			
			printf("[PassphrasedTransaction] parse request result\n");
			try {
				parsedJson = jsonParser.parse(responseStringStream);
				
				Poco::JSON::Object object = *parsedJson.extract<Poco::JSON::Object::Ptr>();
				auto jsonState = object.get("state");
				std::string stateString = jsonState.convert<std::string>();
				if (stateString == "error") {
					addError(new Error("Transfer", "php server return error"));
					if (!object.isNull("msg")) {
						addError(new ParamError("php server", "msg:", object.get("msg").convert<std::string>().data()));
					}
					if (!object.isNull("details")) {
						addError(new ParamError("php server", "details:", object.get("details").convert<std::string>().data()));
					}
				} else if(stateString == "success") {
					printf("[PassphrasedTransaction] request success, wait on transaction ready\n");
					auto currentActiveTransaction = session->getNextReadyTransaction();
					while(currentActiveTransaction.isNull()) {
						Poco::Thread::sleep(10);
						currentActiveTransaction = session->getNextReadyTransaction();
					}
					if(!currentActiveTransaction->isTransfer()) {
						addError(new Error("Transaction", "Falsche Transaktion, bitte erst alle anderen Transaktionen abschließen und dann Seite neuladen"));
					} else {
						//auto signing = new SigningTransaction(currentActiveTransaction, user);
						printf("[PassphrasedTransaction] cannot sign, implementation missing\n");
						/*if(!signing->run()) {
							
						} else {
							addError(new Error("Transaction", "Fehler beim signieren, bitter erneut versuchen"));
						}*/
						// remove transaction from list
						//mSession->finalizeTransaction(true, true);
					}
				}
			}
			catch (Poco::Exception& ex) {
				//printf("[JsonRequestHandler::handleRequest] Exception: %s\n", ex.displayText().data());
				addError(new ParamError("Transfer", "Fehler beim erstellen der Transaktion, bitte erneut versuchen", ex.displayText().data()));
				errorString = responseStringStream.str();
				sm->releaseSession(session);
				session = nullptr;
			}
			if(session) {
				sm->releaseSession(session);
			}
		}
	}
	
	
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
#line 137 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
 if("" == errorString) { 	responseStream << "\n";
	responseStream << "\t";
#line 138 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( errorString );
	responseStream << "\n";
#line 139 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t";
#line 141 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 142 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
 if(PAGE_STATE_INPUT == state) { 	responseStream << "\n";
	responseStream << "\t\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<p><label style=\"width:auto\" for=\"passphrase\">Sender Passphrase</label></p>\n";
	responseStream << "\t\t\t<p><textarea style=\"width:100%;height:100px\" name=\"passphrase\">";
#line 147 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase", "") : "" );
	responseStream << "</textarea></p>\n";
	responseStream << "\t\t\t<p><label style=\"width:auto\" for=\"memo-text\">Verwendungszweck für Überweisung:</label></p>\n";
	responseStream << "\t\t\t<p><textarea name=\"memo\" id=\"memo-text\" rows=\"4\">";
#line 149 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( !form.empty() ? form.get("memo-text", "") : "" );
	responseStream << "</textarea></p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"recevier\">Empfänger Public Key Hex</label>\n";
	responseStream << "\t\t\t\t<input id=\"recevier\" type=\"recevier\" recevier=\"email\" value=\"";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( !form.empty() ? form.get("recevier") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p><input type=\"submit\" style=\"width:auto\" name=\"transfer\" value=\"Guthaben auf neue Adresse &uuml;berweisen!\"></p>\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t";
#line 157 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
 } else if(PAGE_STATE_SUCCESS == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>Gradidos wurden erfolgreich überwiesen.</p>\n";
	responseStream << "\t\t<a href=\"";
#line 159 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/passphrased_transaction\">Weitere Gradidos überweisen</a>\n";
	responseStream << "\t";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\PassphrasedTransaction.cpsp"
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
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
