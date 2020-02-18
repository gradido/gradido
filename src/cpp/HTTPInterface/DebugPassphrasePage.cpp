#include "DebugPassphrasePage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"

#include "../crypto/KeyPair.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


DebugPassphrasePage::DebugPassphrasePage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void DebugPassphrasePage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"

	const char* pageName = "Debug Passphrase";
	auto mm = MemoryManager::getInstance();
	KeyPair keys;
	std::string privKeyHex = "";
	std::string privKeyCryptedHex = "";
	User::passwordHashed pwdHashed = 0;
	Poco::AutoPtr<controller::User> existingUser;
	if(!form.empty()) {
		auto passphrase = KeyPair::filterPassphrase(form.get("passphrase", ""));
		Mnemonic* wordSource = nullptr;
		if(!User::validatePassphrase(passphrase, &wordSource)) {
			addError(new Error("debug Passphrase", "invalid passphrase"));
		} else {
			keys.generateFromPassphrase(passphrase.data(), wordSource);
		}
		auto email = form.get("email", "");
		auto newUser = new User(email.data(), "first_name", "last_name");
		
		
		if(email != "") {
			existingUser = controller::User::create();
			existingUser->load(email);
		}
		newUser->validatePwd(form.get("password", ""), this);
		pwdHashed = newUser->getPwdHashed();
		auto privKey = keys.getPrivateKey();
		if(privKey) {
			privKeyHex = KeyPair::getHex(privKey);
			auto privKeyCrypted = newUser->encrypt(privKey);
			if(privKeyCrypted) {
				privKeyCryptedHex = KeyPair::getHex(privKeyCrypted);
				mm->releaseMemory(privKeyCrypted);
			}
		}
		getErrors(newUser);
		delete newUser;
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
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Debug Passphrase</h1>\n";
	responseStream << "\t";
#line 53 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Userdata</legend>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"email\" type=\"email\" name=\"email\" value=\"";
#line 59 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"password\">Passwort</label>\n";
	responseStream << "\t\t\t\t<input id=\"password\" type=\"password\" name=\"password\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"passphrase\">";
#line 65 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed\" type=\"submit\" name=\"submit\" value=\"Debug\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t<p>Public key:<br>";
#line 69 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( keys.getPubkeyHex() );
	responseStream << "</p>\n";
	responseStream << "\t<p>Private Key:<br>";
#line 70 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( privKeyHex );
	responseStream << "</p>\n";
	responseStream << "\t<p>Passwort Hashed:<br>";
#line 71 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( std::to_string(pwdHashed) );
	responseStream << "</p>\n";
	responseStream << "\t<p>Private key crypted:<br>";
#line 72 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( privKeyCryptedHex );
	responseStream << "</p>\n";
	responseStream << "\t";
#line 73 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 if(!existingUser.isNull()) { 
		 auto userModel = existingUser->getModel(); 
		 auto dbPubkey = userModel->getPublicKey();
		 	responseStream << "\n";
	responseStream << "\t\t<p>user Public: <br>";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( KeyPair::getHex(dbPubkey, ed25519_pubkey_SIZE) );
	responseStream << "</p>\n";
	responseStream << "\t";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
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
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
