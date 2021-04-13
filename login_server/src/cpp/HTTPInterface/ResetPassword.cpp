#include "ResetPassword.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"

#include "../SingletonManager/LanguageManager.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"
#include "../controller/User.h"
#include "../controller/UserBackup.h"

enum PageState {
	PAGE_EMAIL_ASK,
	PAGE_ASK,
	PAGE_WAIT_EMAIL,
	PAGE_WAIT_ADMIN,
	PAGE_EMAIL_ALREADY_SEND
};
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


void ResetPassword::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 20 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"

	PageState state = PAGE_EMAIL_ASK;
	auto lm = LanguageManager::getInstance();
	auto sm = SessionManager::getInstance();
	auto adminReceiver = EmailManager::getInstance()->getAdminReceiver();

	const char* pageName = "Passwort vergessen";
	auto lang = chooseLanguage(request);

	// class="btn btn-outline-secondary flag-btn"
	// class="btn btn-secondary disabled flag-btn" disabled
	std::string eng_btn_classes = "";
	std::string de_btn_classes = "";

	auto langCatalog = lm->getFreeCatalog(lang);

	std::string emailInputClass = "form-control";
	std::string passphraseRadioClass = "group";

	std::string email = "";

	if(!form.empty()) {
		auto session = sm->getNewSession();
		email = form.get("email", "");
		auto passphraseMemorized = form.get("passphrase_memorized", "");
		auto user = controller::User::create();
		auto ask = form.get("ask_passphrase", "");

		if(email != "")
		{
			bool user_exist = false;
			bool sendUserEmail = false;

			if(!sm->isValid(email, VALIDATE_EMAIL)) {
				addError(new Error(gettext(session, "E-Mail"), gettext(session, "Das ist keine g&uuml;ltige E-Mail Adresse")), false);
				emailInputClass += " is-invalid";
			}
			user_exist = user->load(email) == 1;

			if(ask == "true")
			{
				if(passphraseMemorized == "") {
					addError(new Error(gettext(session, "Passphrase"), gettext(session, "Bitte w&auml;hle eine Option aus.")), false);
					passphraseRadioClass += " group-is-invalid";
				} else if(passphraseMemorized == "true") {
					sendUserEmail = true;
				}

			}
			else
			{
				if(user_exist && (!user->tryLoadPassphraseUserBackup() || !user->hasPublicKey())) {
					sendUserEmail = true;
				}
			}

			if(!errorCount())
			{
				// send reset password email
				int result = 0;
				if(user_exist) {
					result = session->sendResetPasswordEmail(user, sendUserEmail, getBaseUrl());
				}

				if(2 == result) {
					state = PAGE_EMAIL_ALREADY_SEND;
				} else if(sendUserEmail) {
					state = PAGE_WAIT_EMAIL;
				} else {
					state = PAGE_WAIT_ADMIN;
				}
			}
		}
		else
		{
			addError(new Error(gettext(session, "E-Mail"), gettext(session, "E-Mail Adresse nicht angegeben.")), false);
			emailInputClass += " is-invalid";
		}

	}


#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

	bool withMaterialIcons = false;
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/main.css\">\n";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 if(withMaterialIcons) { 	responseStream << "\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 14 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 } 	responseStream << "\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "        <div class=\"center-form-single\">\n";
	responseStream << "            <div class=\"center-form-header\">\n";
	responseStream << "                <a href=\"";
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"center-logo\">\n";
	responseStream << "                    <picture>\n";
	responseStream << "                        <source srcset=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "                        <source srcset=\"";
#line 24 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\">\n";
	responseStream << "                        <img src=\"";
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "                    </picture>\n";
	responseStream << "                </a>\n";
	responseStream << "            </div>";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "        ";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t    <div class=\"center-form-container\">\n";
	responseStream << "\t        <div class=\"center-form-title\">\n";
	responseStream << "\t            <h1>Passwort zurücksetzen</h1>\n";
	responseStream << "\t        </div>\n";
	responseStream << "    ";
#line 108 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 if(state == PAGE_EMAIL_ASK) { 	responseStream << "\n";
	responseStream << "            <div class=\"center-form-form\">\n";
	responseStream << "\t\t\t\t<form action=\"";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/resetPassword\">\n";
	responseStream << "\t\t\t\t\t<div class=\"item-wrapper\">\n";
	responseStream << "\t\t\t\t\t  <div class=\"form-group\">\n";
	responseStream << "\t\t\t\t\t\t<label class=\"form-label\" for=\"email\">";
#line 113 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Gib bitte hier deine E-Mail Adresse an:") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t\t<input class=\"form-control\" type=\"text\" class=\"";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( emailInputClass );
	responseStream << "\" name=\"email\" id=\"email\" placeholder=\"E-Mail\" value=\"";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( email );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t\t  <button type=\"submit\" class=\"center-form-submit form-button\" >";
#line 116 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Bestätigen") );
	responseStream << "</button>\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</form>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t";
#line 120 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 } else if(state == PAGE_ASK) { 	responseStream << "\n";
	responseStream << "            <div class=\"center-form-form\">\n";
	responseStream << "\t\t\t\t";
	// begin include flags.cpsp
	responseStream << "<div class=\"center-form-selectors\">\n";
	responseStream << "<form method=\"GET\" action=\"\">\n";
	responseStream << "\t<button id=\"flag-england\" name=\"lang\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"flag-btn\"";
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 4 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-england\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "\t<button id=\"flag-germany\" name=\"lang\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"flag-btn\"";
#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 }
	else { 	responseStream << "class=\"flag-btn\" disabled";
#line 8 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t  <span class=\"flag flag-germany\"></span>\n";
	responseStream << "\t</button>\n";
	responseStream << "</form>\n";
	responseStream << "</div>";
	// end include flags.cpsp
	responseStream << "\n";
	responseStream << "\t\t\t\t<form action=\"";
#line 123 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( getBaseUrl() );
	responseStream << "/resetPassword\">\n";
	responseStream << "\t\t\t\t\t<label class=\"form-label\" for=\"email\">";
#line 124 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Gib bitte hier deine E-Mail Adresse an:") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t<input class=\"form-control\" type=\"text\" class=\"";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( emailInputClass );
	responseStream << "\" name=\"email\" id=\"email\" placeholder=\"E-Mail\" value=\"";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( email );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t<label>";
#line 126 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Hast du dir deine Passphrase notiert oder gemerkt?") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t<input class=\"form-control\" type=\"hidden\" name=\"ask_passphrase\" value=\"true\">\n";
	responseStream << "\t\t\t\t\t<div class=\"";
#line 128 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( passphraseRadioClass );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t\t<div class=\"radio\">\n";
	responseStream << "\t\t\t\t\t\t  <label class=\"form-label\" class=\"radio-label mr-4\">\n";
	responseStream << "\t\t\t\t\t\t\t<input class=\"form-control\" name=\"passphrase_memorized\" onclick=\"removeGroupInvalidClass()\"  type=\"radio\" value=\"true\">";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Ja") );
	responseStream << " <i class=\"input-frame\"></i>\n";
	responseStream << "\t\t\t\t\t\t  </label>\n";
	responseStream << "\t\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t\t<div class=\"radio\">\n";
	responseStream << "\t\t\t\t\t\t  <label class=\"form-label\" class=\"radio-label\">\n";
	responseStream << "\t\t\t\t\t\t\t<input class=\"form-control\" name=\"passphrase_memorized\" onclick=\"removeGroupInvalidClass()\" type=\"radio\" value=\"false\">";
#line 136 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Nein") );
	responseStream << " <i class=\"input-frame\"></i>\n";
	responseStream << "\t\t\t\t\t\t  </label>\n";
	responseStream << "\t\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t  <button type=\"submit\" class=\"center-form-submit form-button\" name=\"ask\" >";
#line 140 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Absenden") );
	responseStream << "</button>\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</form>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t  ";
#line 144 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 } else if(state == PAGE_WAIT_EMAIL) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 145 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Dir wird eine E-Mail zugeschickt um dein Passwort zur&uuml;ckzusetzen.") );
	responseStream << "\n";
	responseStream << "\t  ";
#line 146 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 } else if(state == PAGE_WAIT_ADMIN) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 147 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Der Admin hat eine E-Mail bekommen und wird sich bei dir melden.") );
	responseStream << "\n";
	responseStream << "\t  ";
#line 148 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 } else if(state == PAGE_EMAIL_ALREADY_SEND) { 	responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 149 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Du hast bereits eine E-Mail bekommen. Bitte schau auch in dein Spam-Verzeichnis nach. ") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p>";
#line 150 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("Du hast wirklich keine E-Mail erhalten und auch schon ein paar Minuten gewartet?") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p><b><a href=\"mailto:";
#line 151 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( adminReceiver );
	responseStream << "?subject=Error Reset Password email&amp;body=Hallo Dario,%0D%0A%0D%0Aich habe keine Passwort zurücksetzen E-Mail erhalten,%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">";
#line 151 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
	responseStream << ( langCatalog->gettext("E-Mail an Support schicken"));
	responseStream << "</a></b></p>\n";
	responseStream << "\t  ";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\resetPassword.cpsp"
 } 	responseStream << "\n";
	responseStream << "          </div>\n";
	responseStream << "          </div>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "    </div>\n";
	responseStream << "\t<script type=\"text/javascript\">\n";
	responseStream << "\t\tfunction removeGroupInvalidClass() {\n";
	responseStream << "\t\t\tvar elements = document.getElementsByClassName(\"group-is-invalid\");\n";
	responseStream << "\t\t\tif(elements.length > 0) {\n";
	responseStream << "\t\t\t\telements[0].classList.remove(\"group-is-invalid\");\n";
	responseStream << "\t\t\t}\n";
	responseStream << "\t\t}\n";
	responseStream << "\t</script>\n";
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
