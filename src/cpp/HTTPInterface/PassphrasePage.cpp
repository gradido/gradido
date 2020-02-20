#include "PassphrasePage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../Crypto/KeyPair.h"
#include "../ServerConfig.h"
//#include "Poco/Net/HTTPServerParams.h"

enum PageState 
{
	PAGE_ASK_PASSPHRASE,
	PAGE_SHOW_PASSPHRASE,
	PAGE_ASK_ENSURE_PASSPHRASE,
	PAGE_FORCE_ASK_PASSPHRASE
};
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


PassphrasePage::PassphrasePage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void PassphrasePage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"

	const char* pageName = gettext("Passphrase");
	std::string pageTitle = gettext("Ein neues Konto anlegen");
	std::string pageSubtitle = gettext("Passphrase");
	PageState state = PAGE_ASK_PASSPHRASE;
	auto lang = mSession->getLanguage();
	
	auto sm = SessionManager::getInstance();
	auto uri_start = ServerConfig::g_serverPath;//request.serverParams().getServerName();
	Mnemonic* wordSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER];
	
	// remove old cookies if exist
	sm->deleteLoginCookies(request, response, mSession);
	// save login cookie, because maybe we've get an new session
	response.addCookie(mSession->getLoginCookie());
	
	if(mSession->getSessionState() == SESSION_STATE_RESET_PASSWORD_REQUEST) {
		state = PAGE_FORCE_ASK_PASSPHRASE;
	}
	
	if (!form.empty()) {
		auto registerKeyChoice = form.get("passphrase", "no");
		std::string oldPassphrase = "";
		if (registerKeyChoice == "no") {
			auto oldPassphrase = KeyPair::filterPassphrase(form.get("passphrase-existing", ""));
			
			if (oldPassphrase != "" && User::validatePassphrase(oldPassphrase, &wordSource)) {
				// passphrase is valid 
				if(PAGE_FORCE_ASK_PASSPHRASE == state) {
					auto compareResult = mSession->comparePassphraseWithSavedKeys(oldPassphrase, wordSource);
					if(-2 == compareResult) {
						response.redirect(ServerConfig::g_serverPath + "/error500");
						return;
					} else if(1 == compareResult) {
						response.redirect(ServerConfig::g_serverPath + "/updateUserPassword");
						return;
					}
				} else {
					mSession->setPassphrase(oldPassphrase);
					mSession->updateState(SESSION_STATE_PASSPHRASE_SHOWN);
					state = PAGE_SHOW_PASSPHRASE;
				}
			}
			else {
				addError(new Error("Passphrase", "Diese Passphrase ist ung&uuml;ltig, bitte &uuml;berpr&uuml;fen oder neu generieren (lassen)."));
			}
		}
		else if (registerKeyChoice == "yes") {
			mSession->generatePassphrase();
		}
	}

	if(mSession->getSessionState() == SESSION_STATE_PASSPHRASE_GENERATED) {
		state = PAGE_SHOW_PASSPHRASE;
		mSession->updateState(SESSION_STATE_PASSPHRASE_SHOWN);
	}
	if(state == PAGE_ASK_ENSURE_PASSPHRASE) {
		pageSubtitle = gettext("Passphrase überprüfen");
	}
	else if(state == PAGE_ASK_PASSPHRASE) {
		pageSubtitle = gettext("Passphrase erfragen");
	} else if(state == PAGE_FORCE_ASK_PASSPHRASE) {
		pageTitle = gettext("Neues Passwort anlegen");
		pageSubtitle = gettext("Passphrase erfragen");
	}
	getErrors(mSession);
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include login_header.cpsp
	// begin include header.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/loginServer/style.css\">\n";
	responseStream << "</head>\n";
	responseStream << "<body class=\"header-fixed\">\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 15 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 20 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"authentication-theme auth-style_1\">\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-12 logo-section\">\n";
	responseStream << "          <a href=\"";
#line 5 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login_header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"logo\">\n";
	responseStream << "            <picture>\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login_header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.webp\" type=\"image/webp\">\n";
	responseStream << "\t\t\t\t<source srcset=\"";
#line 8 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login_header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" type=\"image/png\"> \n";
	responseStream << "\t\t\t\t<img src=\"";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login_header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift.png\" alt=\"logo\" />\n";
	responseStream << "\t\t\t</picture>\n";
	responseStream << "          </a>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"row\">\n";
	responseStream << "        <div class=\"col-lg-5 col-md-7 col-sm-9 col-11 mx-auto\">\n";
	responseStream << "          <div class=\"grid\">\n";
	responseStream << "            <div class=\"center-ul-container\">\n";
	responseStream << "              ";
#line 18 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\login_header.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"grid-body\">";
	// end include login_header.cpsp
	// begin include flags.cpsp
	responseStream << "<div class=\"row pull-right-row\">\n";
	responseStream << "  <div class=\"equel-grid pull-right\">\n";
	responseStream << "\t<div class=\"grid-body-small text-center\">\n";
	responseStream << "\t\t<button id=\"flag-england\" name=\"lang\" value=\"en\" title=\"English\" type=\"submit\" ";
#line 4 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_EN) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 4 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 
		else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 5 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t\t  <span class=\"flag-england\"></span>\n";
	responseStream << "\t\t</button>\n";
	responseStream << "\t</div>\n";
	responseStream << "  </div>\n";
	responseStream << "  <div class=\"equel-grid pull-right\">\n";
	responseStream << "\t<div class=\"grid-body-small text-center\">\n";
	responseStream << "\t\t<button id=\"flag-germany\" name=\"lang\" value=\"de\" title=\"Deutsch\" type=\"submit\" ";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 if(lang != LANG_DE) { 	responseStream << "class=\"btn btn-outline-secondary flag-btn\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 
		else { 	responseStream << "class=\"btn btn-secondary disabled flag-btn\" disabled";
#line 13 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\flags.cpsp"
 } 	responseStream << ">\n";
	responseStream << "\t\t  <span class=\"flag-germany\"></span>\n";
	responseStream << "\t\t</button>\n";
	responseStream << "\t</div>\n";
	responseStream << "  </div>\n";
	responseStream << "</div>";
	// end include flags.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"row mb-3\">\n";
	responseStream << "\t<h2>";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( pageTitle );
	responseStream << "</h2>\n";
	responseStream << "\t<h3 class=\"mx-auto\">";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( pageSubtitle );
	responseStream << "</h3>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"item-wrapper\">\n";
	responseStream << "\t<div class=\"row mb-3\">\n";
	responseStream << "\t";
#line 94 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 if(state == PAGE_SHOW_PASSPHRASE) {	responseStream << "\n";
	responseStream << "\t  <div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t<div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t\t  <div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t\t<div class=\"alert alert-orange\">\n";
	responseStream << "\t\t\t  <h5 class=\"alert-heading\">";
#line 99 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Was zu tun ist:") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t  <p>";
#line 100 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Schreibe dir deine Passphrase auf und packe sie gut weg. Du brauchst sie um deine Adresse wiederherzustellen. Wenn du sie verlierst, sind auch deine Gradidos verloren.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"col-lg-8 col-md-10 mx-auto alert alert-primary\" style=\"text-align:center\">\n";
	responseStream << "\t\t\t  <h5 class=\"alert-heading\">";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Passphrase") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t  <p>";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( mSession->getPassphrase() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"alert alert-secondary\">\n";
	responseStream << "\t\t\t  <h5 class=\"alert-heading\">";
#line 107 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Was ist eine Passphrase?") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t  <p>";
#line 108 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Die Passphrase kommt aus dem Crypto-Bereich und ist ein Weg einen komplizierte kryptografischen Schlüssel in einer lesbaren Form darzustellen.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t  <p>";
#line 109 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Der neue Gradido basiert technisch auf einer Kryptowährung (wie z.B. Bitcoin) um maximale Sicherheit zu erreichen.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t  <a href=\"";
#line 112 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/passphrase\" class=\"btn btn-sm btn-primary pull-right\" name=\"next\">";
#line 112 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Weiter") );
	responseStream << "</a>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t  ";
#line 115 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 } else if(state == PAGE_ASK_ENSURE_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t  <div class=\"\">\n";
	responseStream << "\t\t  <div class=\"item-wrapper\">\n";
	responseStream << "\t\t\t<div class=\"row mb-3\">\n";
	responseStream << "\t\t\t  <div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t\t\t<form>\n";
	responseStream << "\t\t\t\t  <div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t\t\t\t\t<div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t\t\t\t  <div class=\"alert alert-orange\">\n";
	responseStream << "\t\t\t\t\t\t<h5 class=\"alert-heading\">";
#line 124 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Was zu tun ist:") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t\t\t\t<p>";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Hast du dir deine Passphrase gemerkt?") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t\t\t<p>";
#line 126 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Dann zeig es mir. Zur Unterstützung gebe ich dir deine Wörter aber in anderer Reihenfolge.") );
	responseStream << "<p>\n";
	responseStream << "\t\t\t\t\t\t<p>";
#line 127 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Klicke sie an um sie einzusetzen.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t\t  <div id=\"gradido-mithril-passphrase\"></div>\n";
	responseStream << "\t\t\t\t\t  <noscript>\n";
	responseStream << "\t\t\t\t\t\t";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Ohne Javascript kannst du auch gleich weiter machen:") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<a href=\"saveKeys\" class=\"btn btn-sm btn-primary pull-right\" name=\"next\">Weiter</a>\n";
	responseStream << "\t\t\t\t\t  </noscript>\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t</form>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t\t<script type=\"text/javascript\">\n";
	responseStream << "\t\t\tvar mnemonicWords = \"";
#line 142 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 wordSource->getSortedWordList().stringify(responseStream); 	responseStream << "\";\n";
	responseStream << "\t\t</script>\n";
	responseStream << "\t  ";
#line 144 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 } else if(state == PAGE_ASK_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t  <div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t<div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t\t  <div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t\t<div class=\"col-lg-8 col-md-10 mx-auto alert alert-primary\" style=\"text-align:center\">\n";
	responseStream << "\t\t\t  <h5 class=\"alert-heading\">";
#line 149 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Passphrase") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t  <p>";
#line 150 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Deine E-Mail Adresse wurde erfolgreich bestätigt.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<form method=\"POST\" action=\"";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/passphrase\">\n";
	responseStream << "\t\t\t\t<div class=\"alert alert-orange\">\n";
	responseStream << "\t\t\t\t  <h5 class=\"alert-heading\">";
#line 154 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Neue Gradido Adresse anlegen / wiederherstellen") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t\t  <p>";
#line 155 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Möchtest Du ein bestehendes* Gradido-Konto wiederherstellen oder ein neues anlegen?") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t  <p>";
#line 156 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("*Das Konto muss nach dem 01.09.2019 angelegt worden sein.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"col-md-9\">\n";
	responseStream << "\t\t\t\t\t\t<div class=\"form-group\">\n";
	responseStream << "\t\t\t\t\t\t\t<div class=\"radio alert-orange\">\n";
	responseStream << "\t\t\t\t\t\t\t\t<label for=\"passphrase-new-yes\" class=\"radio-label mr-4\">\n";
	responseStream << "\t\t\t\t\t\t\t\t\t<input id=\"passphrase-new-yes\" name=\"passphrase\" type=\"radio\" value=\"yes\" checked/>\n";
	responseStream << "\t\t\t\t\t\t\t\t\t";
#line 164 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Nein, bitte ein neues erstellen!") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t\t\t<i class=\"input-frame\"></i>\n";
	responseStream << "\t\t\t\t\t\t\t\t</label>\n";
	responseStream << "\t\t\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t\t\t<div class=\"radio alert-orange\">\n";
	responseStream << "\t\t\t\t\t\t\t\t<label for=\"passphrase-new-no\" class=\"radio-label mr-4\">\n";
	responseStream << "\t\t\t\t\t\t\t\t\t<input id=\"passphrase-new-no\" name=\"passphrase\" type=\"radio\" value=\"no\"/>\n";
	responseStream << "\t\t\t\t\t\t\t\t\t";
#line 171 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Ja, bitte wiederherstellen!") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t\t\t<i class=\"input-frame\"></i>\n";
	responseStream << "\t\t\t\t\t\t\t\t</label>\n";
	responseStream << "\t\t\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t\t\t<textarea class=\"form-control\" name=\"passphrase-existing\" cols=\"12\" rows=\"5\">";
#line 176 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase-existing", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t\t\t\t\t<button type=\"submit\" class=\"btn btn-sm btn-primary pull-right\" name=\"submit\">";
#line 177 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Weiter") );
	responseStream << "</button>\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t  <!--<a href=\"";
#line 182 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/passphrase\" class=\"btn btn-sm btn-primary pull-right\" name=\"next\">";
#line 182 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Weiter") );
	responseStream << "</a>-->\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t  ";
#line 185 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 } else if(state == PAGE_FORCE_ASK_PASSPHRASE) { 	responseStream << "\n";
	responseStream << "\t  <div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t<div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t\t  <div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t\t<div class=\"col-lg-8 col-md-10 mx-auto alert alert-primary\" style=\"text-align:center\">\n";
	responseStream << "\t\t\t  <h5 class=\"alert-heading\">";
#line 190 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Konto wiederherstellen / Neues Passwort anlegen") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t  <p>";
#line 191 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Um dein Konto wiederherzustellen, dir ein Neues Passwort auswählen zu können, tippe hier bitte die Wörter deiner Passphrase in der richtigen Reihenfolge ein, welche du dir aufgeschrieben hast.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<form method=\"POST\" action=\"";
#line 193 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/passphrase\">\n";
	responseStream << "\t\t\t\t<textarea class=\"form-control\" name=\"passphrase-existing\" cols=\"12\" rows=\"5\">";
#line 194 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( !form.empty() ? form.get("passphrase-existing", "") : "" );
	responseStream << "</textarea>\n";
	responseStream << "\t\t\t\t<button type=\"submit\" class=\"btn btn-sm btn-primary pull-right\" name=\"submit\">";
#line 195 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Weiter") );
	responseStream << "</button>\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t  ";
#line 200 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t\t<div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t\t\t  <div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t\t\t<div class=\"col-lg-8 col-md-10 mx-auto alert alert-danger\" style=\"text-align:center\">\n";
	responseStream << "\t\t\t\t  <h5 class=\"alert-heading\">";
#line 205 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Fehler") );
	responseStream << "</h5>\n";
	responseStream << "\t\t\t\t  <p>";
#line 206 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
	responseStream << ( gettext("Ungültige Seite, wenn du das siehst stimmt hier etwas nicht. Bitte wende dich an den Server-Admin.") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  ";
#line 211 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\passphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</div>\n";
	// begin include footer_ripple.cpsp
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "        <!-- content viewport ends -->\n";
	responseStream << "        <!-- partial:partials/_footer.html -->\n";
	responseStream << "        <footer class=\"footer\">\n";
	responseStream << "          <div class=\"row\">\n";
	responseStream << "            <div class=\"col-sm-6 text-center text-sm-right order-sm-1\">\n";
	responseStream << "              <ul class=\"text-gray\">\n";
	responseStream << "\t\t\t\t<li><a href=\"https://gradido.net/de/datenschutz/\" target=\"_blank\">Datenschutzerkl&auml;rung</a></li>\n";
	responseStream << "                <li><a href=\"https://gradido.net/de/impressum/\" target=\"_blank\">Impressum</a></li>\n";
	responseStream << "              </ul>\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"col-sm-6 text-center text-sm-left mt-3 mt-sm-0\">\n";
	responseStream << "              <small class=\"text-muted d-block\">Copyright © 2020 Gradido</small>\n";
	responseStream << "            </div>\n";
	responseStream << "          </div>\n";
	responseStream << "        </footer>\n";
	responseStream << "        <!-- partial -->\n";
	responseStream << "      </div>\n";
	responseStream << "      <!-- page content ends -->\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"grd-time-used dev-info\">\n";
	responseStream << "        ";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer_ripple.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "    </div>\n";
	responseStream << "    <!--page body ends -->\n";
	responseStream << "    <!-- SCRIPT LOADING START FORM HERE /////////////-->\n";
	responseStream << "    <!-- plugins:js -->\n";
	responseStream << "    <!--<script src=\"../../../assets/vendors/js/core.js\"></script>-->\n";
	responseStream << "    <!--<script src=\"../../../assets/vendors/js/vendor.addons.js\"></script>-->\n";
	responseStream << "    <!-- endinject -->\n";
	responseStream << "    <!-- Vendor Js For This Page Ends-->\n";
	responseStream << "    <!--<script src=\"../../../assets/vendors/chartjs/Chart.min.js\"></script>-->\n";
	responseStream << "    <!-- Vendor Js For This Page Ends-->\n";
	responseStream << "    <!-- build:js -->\n";
	responseStream << "    <!--<script src=\"../../../assets/js/template.js\"></script>-->\n";
	responseStream << "    <script src=\"";
#line 36 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer_ripple.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/js/basic.js\"></script>\n";
	responseStream << "    <!--<script src=\"../../../assets/js/dashboard.js\"></script>-->\n";
	responseStream << "    <!-- endbuild -->\n";
	responseStream << "  </body>\n";
	responseStream << "</html>\n";
	responseStream << "   ";
	// end include footer_ripple.cpsp
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
