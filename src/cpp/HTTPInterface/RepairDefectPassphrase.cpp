#include "RepairDefectPassphrase.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"

#include "../SingletonManager/MemoryManager.h"
#include "../SingletonManager/EmailManager.h"
#include "../crypto/KeyPair.h"
#include "../controller/UserBackups.h"
#include "../tasks/SigningTransaction.h"
#include "../ServerConfig.h"

#include "Poco/JSON/Object.h"
#include "Poco/JSON/Parser.h"
#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

enum PageState 
{
	GENERATE_PASSPHRASE,
	SHOW_PASSPHRASE,
	CREATE_TRANSACTION,
	CHECK_TRANSACTION,
	FINISH
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


RepairDefectPassphrase::RepairDefectPassphrase(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void RepairDefectPassphrase::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 31 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"

	auto mm = MemoryManager::getInstance();
	auto em = EmailManager::getInstance();
	auto user = mSession->getUser();
	auto privKey = user->getPrivKey();
	auto adminEmail =  em->getAdminReceiver();
	Mnemonic* wordSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER];
	std::string pageName = "Repariere Defekte Passphrase";
	
	std::string errorString = "";
	
	PageState state = GENERATE_PASSPHRASE;
	
	
	if(!form.empty()) 
	{
		printf("form not empty\n");
		auto btn = form.get("generate", "");
		auto btn2 = form.get("transfer", "");
		printf("btn: %s\n", btn.data());
		printf("btn2: %s\n", btn2.data());
		if(btn == "Neue Passphrase generieren!") 
		{
			if(!mSession->generatePassphrase()) 
			{
				addError(new Error("Passphrase", "Fehler beim generieren der Passphrase, evt. erneut versuchen!"));
			} 
			else 
			{
				auto newPassphrase = mSession->getPassphrase();
				if(!User::validatePassphrase(newPassphrase, &wordSource)) 
				{
					addError(new Error("Passphrase", "Fehler beim validieren der Passphrase"));
				} 
				else
				{
					KeyPair keys; 
					if(!keys.generateFromPassphrase(newPassphrase.data(), wordSource)) 
					{
						addError(new Error("Passphrase", "Konnte keine Keys aus der Passphrase generieren"));
					} 
					else 
					{
						auto newPassphraseModel = controller::UserBackups::create(user->getDBId(), newPassphrase);
						auto result = newPassphraseModel->getModel()->insertIntoDB(false);
						//state = SHOW_PASSPHRASE;
						if(result) {
							state = SHOW_PASSPHRASE;
						} else {
							addError(new Error("Speichern", "Fehler beim speichern der neuen Passphrase, evt. erneut versuchen!"));
						}//*/
					}
				}
			}
		} 
		else if("" != btn2) 
		{
			KeyPair keys;
			auto newPassphrase = mSession->getPassphrase();
			
			if(!User::validatePassphrase(newPassphrase, &wordSource) || !keys.generateFromPassphrase(mSession->getPassphrase().data(), wordSource)) {
				addError(new Error("Passphrase", "Ungültige Passphrase, bitte neuladen"));
			}
			// create payload
			Poco::JSON::Object requestJson;
			Poco::JSON::Object pubkeys;
			pubkeys.set("sender", user->getPublicKeyHex());
			pubkeys.set("receiver", keys.getPubkeyHex());
			requestJson.set("method", "moveTransaction");
			requestJson.set("pubkeys", pubkeys);
			requestJson.set("memo", form.get("memo", ""));
			requestJson.set("session_id", mSession->getHandle());
			
			printf("[repairDefectPassphrase] prepare request\n");
			
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
			
			printf("[repairDefectPassphrase] parse request result\n");
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
					printf("[repairDefectPassphrase] request success, wait on transaction ready\n");
					auto currentActiveTransaction = mSession->getNextReadyTransaction();
					while(currentActiveTransaction.isNull()) {
						Poco::Thread::sleep(10);
						currentActiveTransaction = mSession->getNextReadyTransaction();
					}
					if(!currentActiveTransaction->isTransfer()) {
						addError(new Error("Transaction", "Falsche Transaktion, bitte erst alle anderen Transaktionen abschließen und dann Seite neuladen"));
					} else {
						auto signing = new SigningTransaction(currentActiveTransaction, user);
						printf("[repairDefectPassphrase] before running sign\n");
						if(!signing->run()) {
							auto newUser = mSession->getNewUser();
							auto newUserModel = newUser->getModel();
							auto cryptedPrivKey = user->encrypt(keys.getPrivateKey());
							newUserModel->setPublicKey(keys.getPublicKey());
							newUserModel->setPrivateKey(cryptedPrivKey);
							mm->releaseMemory(cryptedPrivKey);
							if(!newUserModel->updatePrivkey() || !newUserModel->updatePublickey()) {
								printf("[repairDefectPassphrase] error saving keys\n");
								addError(new Error("Speichern", "Fehler beim speichern der neuen Keys in die Datenbank, bitte erneut versuchen (Seite neuladen)"));
							} else {
								//response.redirect(ServerConfig::g_serverPath + "/logout");
								//return;
								printf("[repairDefectPassphrase] set state to FINISH\n");
								state = FINISH;
							}
						} else {
							addError(new Error("Transaction", "Fehler beim signieren, bitter erneut versuchen"));
						}
						// remove transaction from list
						mSession->finalizeTransaction(true, true);
					}
				}
			}
			catch (Poco::Exception& ex) {
				//printf("[JsonRequestHandler::handleRequest] Exception: %s\n", ex.displayText().data());
				addError(new ParamError("Transfer", "Fehler beim erstellen der Transaktion, bitte erneut versuchen", ex.displayText().data()));
				errorString = responseStringStream.str();
			}
			
			//state = CREATE_TRANSACTION;
		}
	}
	mm->releaseMemory(privKey);
	
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
#line 189 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 if("" != errorString) { 	responseStream << "\n";
	responseStream << "\t";
#line 190 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( errorString );
	responseStream << "\n";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t";
#line 193 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<h1>Konto reparieren</h1>\n";
	responseStream << "\t<p>Der Login-Server hat festgestellt das die gespeicherte Passphrase nicht zu deinem Konto passt.</p>\n";
	responseStream << "\t";
#line 196 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 if(GENERATE_PASSPHRASE == state) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 197 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 if(privKey) { 	responseStream << "\n";
	responseStream << "\t\t\t<p>Dein Privat Key konnte noch entschlüsselt werden. Es könnte also eine neue Passphrase generiert werden und dein aktueller Kontostand\n";
	responseStream << "\t\t\tauf die neue Adresse transferiert werden. </p>\n";
	responseStream << "\t\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t\t<input type=\"submit\" style=\"width:auto;\" name=\"generate\" value=\"Neue Passphrase generieren!\">\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t";
#line 203 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } else {	responseStream << "\n";
	responseStream << "\t\t\t<p>Dein Privat Key konnte nicht entschlüsselt werden. Bitte wende dich an den Admin: <a href=\"mailto:";
#line 204 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( adminEmail);
	responseStream << "\">";
#line 204 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( adminEmail );
	responseStream << "</a></p>\n";
	responseStream << "\t\t";
#line 205 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 206 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } else if(SHOW_PASSPHRASE == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>Deine neue Passphrase, bitte schreibe sie dir auf (am besten auf einen Zettel) und hebe sie gut auf. \n";
	responseStream << "\t\tDu brauchst sie wenn du dein Passwort vergessen hast oder dein Konto umziehen möchtest:</p>\n";
	responseStream << "\t\t<fieldset><legend>Deine neue Passphrase:</legend>\n";
	responseStream << "\t\t\t<div class=\"grd_container_small grd_container\">\n";
	responseStream << "\t\t\t\t";
#line 211 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( mSession->getPassphrase() );
	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<p><label style=\"width:auto\" for=\"memo-text\">Verwendungszweck für Überweisung:</label></p>\n";
	responseStream << "\t\t\t<p><textarea name=\"memo\" id=\"memo-text\" rows=\"4\"></textarea></p>\n";
	responseStream << "\t\t\t<p><input type=\"submit\" style=\"width:auto\" name=\"transfer\" value=\"Guthaben auf neue Adresse &uuml;berweisen!\"></p>\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t";
#line 219 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } else if(FINISH == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>Neue Daten erfolgreich gespeichert, bitte logge dich nun aus. Danach kannst du dich gerne wieder einloggen und müsstest dein Guthaben wieder auf deinem Konto haben.</p>\n";
	responseStream << "\t\t<a class=\"grd-nav-bn\" href=\"";
#line 221 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
	responseStream << ( ServerConfig::g_serverPath + "/logout" );
	responseStream << "\">Ausloggen</a>\n";
	responseStream << "\t";
#line 222 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\repairDefectPassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "\t<div class=\"grd-time-used dev-info\">\n";
	responseStream << "\t\t\t";
#line 2 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	// end include footer.cpsp
	if (_compressResponse) _gzipStream.close();
}
