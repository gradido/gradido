#include "DebugPassphrasePage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"

#include "../Crypto/KeyPairEd25519.h"
#include "../controller/User.h"
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
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"

	const char* pageName = "Debug Passphrase";

	KeyPairEd25519* keys = nullptr;
	std::string privKeyCryptedHex = "";
	Poco::UInt64 pwdHashed = 0;
	Poco::AutoPtr<controller::User> existingUser;
	if(!form.empty()) {
		auto passphrase_string = form.get("passphrase", "");
		auto wordSource = Passphrase::detectMnemonic(passphrase_string);
		if(!wordSource) {
			addError(new Error("debug Passphrase", "invalid passphrase"), false);
		} else {
			keys = KeyPairEd25519::create(Passphrase::create(passphrase_string, wordSource));
		}
		auto email = form.get("email", "");
		
		if(email != "") {
			existingUser = controller::User::create();
			if(1 == existingUser->load(email)) {
				auto user_model = existingUser->getModel();
				pwdHashed = user_model->getPasswordHashed();
				if(user_model->hasPrivateKeyEncrypted()) {
					privKeyCryptedHex = user_model->getPrivateKeyEncryptedHex();
				}
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
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Debug Passphrase</h1>\n";
	responseStream << "\t";
#line 44 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Userdata</legend>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"email\">E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"email\" type=\"email\" name=\"email\" value=\"";
#line 50 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<textarea style=\"width:100%;height:100px\" name=\"passphrase\">";
#line 52 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<input class=\"grd-form-bn grd-form-bn-succeed\" type=\"submit\" name=\"submit\" value=\"Debug\">\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 56 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 if(keys) { 	responseStream << "\n";
	responseStream << "\t\t<p>Public key:<br>";
#line 57 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( keys->getPublicKeyHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t<p>Private key crypted:<br>";
#line 58 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( privKeyCryptedHex );
	responseStream << "</p>\n";
	responseStream << "\t\t<p>Passwort Hashed:<br>";
#line 59 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( std::to_string(pwdHashed) );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 60 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 if(!existingUser.isNull()) { 
			 auto userModel = existingUser->getModel(); 
			 auto dbPubkey = userModel->getPublicKey();
			 	responseStream << "\n";
	responseStream << "\t\t\t<p>user Public: <br>";
#line 64 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
	responseStream << ( keys->getPublicKeyHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 65 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 66 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
#line 68 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugPassphrase.cpsp"
 if(keys) delete keys; 	responseStream << "\n";
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
