#include "AdminUserPasswordReset.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"

// includes
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"
#include "../controller/UserBackups.h"


enum PageState
{
	PAGE_ASK_EMAIL,
	PAGE_SHOW_EMAIL
};
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


AdminUserPasswordReset::AdminUserPasswordReset(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminUserPasswordReset::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 19 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"

	// code
	PageState state = PAGE_ASK_EMAIL;
	Poco::AutoPtr<controller::User> user = controller::User::create();
	Poco::AutoPtr<controller::EmailVerificationCode> code;
	Poco::AutoPtr<controller::UserBackups> userBackup;
	bool validUser = false;
	std::string pageName = "Admin User Passwort Reset";
	
	if(!form.empty()) {
		auto email = form.get("user-email", "");
		
		if("" != email) {
			if(1 != user->load(email)) {
				addError(new Error("Benutzer Email", "Konnte keinen passenden Benutzer finden!"));
			} else {
				validUser = true;
			}
		}
	}
	if(validUser) {
		auto userId = user->getModel()->getID();
		code = controller::EmailVerificationCode::load(userId, model::table::EMAIL_OPT_IN_RESET_PASSWORD);
		if(code.isNull()) {
			code = controller::EmailVerificationCode::create(userId, model::table::EMAIL_OPT_IN_RESET_PASSWORD);
			if(!code->getModel()->insertIntoDB(false)) {
				addError(new Error("E-Mail Verification Code", "Fehler beim speichern!"));
				getErrors(code->getModel());
			}
		}
		
		auto backups = controller::UserBackups::load(userId);
		auto userPubkey = user->getModel()->getPublicKey();
		for(auto it = backups.begin(); it != backups.end(); it++) {
			auto keys = (*it)->getKeyPair();
			if(keys->isPubkeysTheSame(userPubkey)) {
				userBackup = *it;
				break;
			}
		}
		if(userBackup.isNull()) {
			addError(new Error("User Backup", "Kein passendes User Backup gefunden!"));
		}
		
		if(!userBackup.isNull() && !code.isNull()) {
			state = PAGE_SHOW_EMAIL;
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
	responseStream << "\t";
#line 70 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<h1>Admin User Passwort Reset</h1>\n";
	responseStream << "\t<p>Ein Benutzer hat ein Passwort Reset angefordert, hat aber seine Passphrase nicht.</p>\n";
	responseStream << "\t";
#line 73 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
 if(PAGE_ASK_EMAIL == state) { 	responseStream << "\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t<form method=\"POST\">\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"user-email\">Benutzer E-Mail</label>\n";
	responseStream << "\t\t\t\t<input id=\"user-email\" type=\"text\" name=\"user-email\" value=\"";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( !form.empty() ? form.get("user-email") : "" );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<p><input type=\"submit\" style=\"width:auto\" value=\"Anzeigen\"></p>\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t";
#line 83 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
 if(validUser) {
		auto userModel = user->getModel(); 	responseStream << "\n";
	responseStream << "\t\t<h3>Benutzer gefunden</h3>\n";
	responseStream << "\t\t<ul>\n";
	responseStream << "\t\t\t<li>";
#line 88 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( userModel->getFirstName() );
	responseStream << " ";
#line 88 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( userModel->getLastName() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t<li>";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( userModel->getEmail() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t<li>Public Key: ";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( userModel->getPublicKeyHex() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t<li>E-Mail überprüft: ";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( std::to_string(userModel->isEmailChecked()) );
	responseStream << "</li>\n";
	responseStream << "\t\t\t<li>Private Key verschlüsselt: ";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( std::to_string(userModel->existPrivateKeyCrypted()) );
	responseStream << "</li>\n";
	responseStream << "\t\t\t<li>Passwort gesetzt: ";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( std::to_string(userModel->getPasswordHashed() != 0) );
	responseStream << "</li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 96 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
 if(PAGE_SHOW_EMAIL == state) { 	responseStream << "\n";
	responseStream << "\t\t<fieldset><legend>E-Mail</legend>\n";
	responseStream << "\t\t\t<p>An: ";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( user->getEmailWithNames() );
	responseStream << "\n";
	responseStream << "\t\t\t<p><label style=\"width:auto\" for=\"memo-text\">E-Mail Text:</label></p>\n";
	responseStream << "<pre>Liebe(r) ";
#line 100 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( user->getModel()->getFirstName() );
	responseStream << ",\n";
	responseStream << "\n";
	responseStream << "hier findest du deine Passphrase mit dessen Hilfe du dir ein neues Passwort einstellen kannst.\n";
	responseStream << "Bitte schreibe sie dir auf und packe sie gut weg.\n";
	responseStream << "\n";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( controller::UserBackups::formatPassphrase(userBackup->getPassphrase(ServerConfig::Mnemonic_Types::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER)) );
	responseStream << "\n";
	responseStream << " \n";
	responseStream << "\n";
	responseStream << "Unter diesem Link kannst du dir mit Hilfe der Passphrase ein neues Passwort setzen:\n";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
	responseStream << ( code->getLink() );
	responseStream << "\n";
	responseStream << " \n";
	responseStream << "\n";
	responseStream << "Liebe Grüße\n";
	responseStream << "Dario, Softwareentwickler bei Gradido\n";
	responseStream << "</pre>\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t";
#line 117 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminUserPasswordReset.cpsp"
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
	responseStream << "\t\n";
	if (_compressResponse) _gzipStream.close();
}
