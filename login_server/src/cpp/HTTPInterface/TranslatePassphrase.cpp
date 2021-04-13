#include "TranslatePassphrase.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 
#include "../Crypto/KeyPairEd25519.h"
#include "../ServerConfig.h"
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


TranslatePassphrase::TranslatePassphrase(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void TranslatePassphrase::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 
	chooseLanguage(request);
	// variable needed for flags
	auto lang = mSession->getLanguage();
	auto uri_start = ServerConfig::g_serverPath;
	const char* pageName = gettext("Passphrase Transformieren");
	std::string passphrase;
	auto role = mSession->getNewUser()->getModel()->getRole();
	std::string inputPassphrase;
	
	Mnemonic* wordSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER];	
	Mnemonic* targetSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES];	
	if(lang == LANG_DE) {
		wordSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES];
		targetSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER];	
	}
	
	if(!form.empty()) 
	{
	
	   inputPassphrase = form.get("inputPassphrase", "");
	   auto localPassphrase = Passphrase::filter(inputPassphrase);
	   
	   auto btnGenerate = form.get("btnGenerate", "");
	   if("" != btnGenerate) {
			auto passphrase_gen = Passphrase::generate(wordSource);
			
			localPassphrase = passphrase_gen->getString();
			inputPassphrase = localPassphrase;
	   }
	   auto passphrase_object = Passphrase::create(localPassphrase, wordSource);
	   if(localPassphrase != "" && passphrase_object.isNull() || !passphrase_object->checkIfValid()) {
			addError(new Error(
				gettext("Fehler"), 
				gettext("Diese Passphrase ist ung&uuml;ltig, bitte &uuml;berpr&uuml;fen oder neu generieren (lassen).")
			), false);
	   } else {
			if(wordSource == &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]) {
				targetSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES];
			} else {
				targetSource = &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER];
			}
			auto transformed_passphrase_obj = passphrase_object->transform(targetSource);
			passphrase = transformed_passphrase_obj->getString();
	   }
	   
	   
	}
#line 3 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

	bool withMaterialIcons = false;
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
	responseStream << "<div class=\"row mb-3\" style=\"margin-top:70px;\">\n";
	responseStream << "\t<h2 class=\"mx-auto\">";
#line 61 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( gettext("Passphrase umwandeln") );
	responseStream << "</h2>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"item-wrapper\">\n";
	responseStream << "<div class=\"row mb-3\">\n";
	responseStream << "  <div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t<div class=\"form-group row showcase_row_area\">\n";
	responseStream << "\t  <div class=\"col-md-12 col-lg-12 \">\n";
	responseStream << "\t\t<div class=\"alert alert-orange\">\n";
	responseStream << "\t\t  <h5 class=\"alert-heading\">";
#line 69 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( gettext("Was zu tun ist:") );
	responseStream << "</h5>\n";
	responseStream << "\t\t  <p>";
#line 70 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( gettext("Kopiere/schreibe deine Passphrase in die Textbox und du bekommst sie in die jeweils andere Sprache umgewandelt.") );
	responseStream << "</p>\n";
	responseStream << "\t\t  <p>";
#line 71 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( gettext("Du kannst mit beiden Varianten dein Konto wiederherstellen oder dein Passwort ändern.") );
	responseStream << "</p>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t  <div class=\"col-lg-12 col-md-12 mb-5\">\n";
	responseStream << "\t\t<form action=\"";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( uri_start );
	responseStream << "/transform_passphrase\">\n";
	responseStream << "\t\t  <div class=\"form-group row-showcase_row_area\">\n";
	responseStream << "\t\t\t<textarea name=\"inputPassphrase\" cols=\"20\" rows=\"10\" id=\"inputPassphrase\" class=\"form-control\" placeholder=\"";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( gettext("deine Passphrase") );
	responseStream << "\">";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( inputPassphrase );
	responseStream << "</textarea>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t  <input name=\"btnTransform\" type=\"submit\" value=\"Umwandeln\" class=\"btn btn btn-orange\">\n";
	responseStream << "\t\t  ";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 if(model::table::ROLE_ADMIN == role) { 	responseStream << "\n";
	responseStream << "\t\t\t<input name=\"btnGenerate\" type=\"submit\" value=\"Neue generieren\" class=\"btn btn-secondary\">\n";
	responseStream << "\t\t  ";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t  ";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 if(passphrase != "") { 	responseStream << "\n";
	responseStream << "\t\t<div class=\"col-lg-12 col-md-12\">\n";
	responseStream << "\t\t\t<div class=\"alert alert-success\">\n";
	responseStream << "\t\t\t\t<h5 class=\"alert-heading\">Umgewandelte Passphrase: </h5>\n";
	responseStream << "\t\t\t\t<p>";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
	responseStream << ( passphrase );
	responseStream << "</p>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  ";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\translatePassphrase.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t</div>\n";
	responseStream << "  </div>\n";
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
	if (_compressResponse) _gzipStream.close();
}
