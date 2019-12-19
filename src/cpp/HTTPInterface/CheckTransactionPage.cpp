#include "CheckTransactionPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../model/TransactionCreation.h"
#include "../model/TransactionTransfer.h"

#include "Poco/Thread.h"

enum PageState {
	PAGE_TRANSACTION_CREATION,
	PAGE_TRANSACTION_TRANSFER,
	PAGE_NO_TRANSACTIONS
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
 
#include "../ServerConfig.h"
#include "../model/TransactionBase.h"	


CheckTransactionPage::CheckTransactionPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void CheckTransactionPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 
	const char* pageName = gettext("&Uuml;berpr&uuml;fe Transaktion");
	auto accountUser = mSession->getUser();
	auto userBalance = accountUser->getBalance();
	std::string memo = "";
	bool hasErrors = false;
	bool enableLogout = true;
	
	if(!form.empty()) {
		auto ok = form.get("ok", "");
		auto abort = form.get("abort", "");
		if(abort != "") {
			mSession->finalizeTransaction(false, true);
		} else if(ok != "") {
			if(!accountUser->hasCryptoKey()) {
				auto pwd = form.get("sign-password", "");
				if(!mSession->isPwdValid(pwd)) {
					addError(new Error(gettext("Passwort"), gettext("Das Passwort stimmt nicht. Bitte verwende dein Passwort von der Registrierung")));
					hasErrors = true;
				}
			}
			if(!hasErrors) {
				mSession->finalizeTransaction(true, false);
			}
		}
	}
	
	PageState state = PAGE_NO_TRANSACTIONS;
	size_t notReadyTransactions = 0;
	size_t sumTransactions = mSession->getProcessingTransactionCount();
	if(sumTransactions == 0) {
		Poco::Thread::sleep(500);
		response.redirect(ServerConfig::g_php_serverPath + "state-balances/overview");
		return;
	}
	auto processingTransaction = mSession->getNextReadyTransaction(&notReadyTransactions);
	if(sumTransactions > 0) {
		enableLogout = false;
	}
	if(!processingTransaction.isNull()) {
		auto transactionType = processingTransaction->getType();
		switch(transactionType) {
			case TRANSACTION_CREATION: state = PAGE_TRANSACTION_CREATION; break;
			case TRANSACTION_TRANSFER: state = PAGE_TRANSACTION_TRANSFER; break;
		}
	}
	
	

	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_navi.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 10 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/rippleUI/style.css\">\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 12 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/materialdesignicons.min.css\">\n";
	responseStream << "</head>\n";
	responseStream << "<body class=\"header-fixed\">\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 17 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	responseStream << "<nav class=\"t-header\">\n";
	responseStream << "      <div class=\"t-header-brand-wrapper\">\n";
	responseStream << "        <a href=\"";
#line 21 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">\n";
	responseStream << "          <img class=\"logo\" src=\"";
#line 22 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift_half.webp\" alt=\"Logo\">\n";
	responseStream << "          <img class=\"logo-mini\" src=\"";
#line 23 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_half.webp\" alt=\"Logo\">\n";
	responseStream << "        </a>\n";
	responseStream << "        <button class=\"t-header-toggler t-header-desk-toggler d-none d-lg-block\">\n";
	responseStream << "          <svg class=\"logo\" viewBox=\"0 0 200 200\">\n";
	responseStream << "            <path class=\"top\" d=\"\n";
	responseStream << "                M 40, 80\n";
	responseStream << "                C 40, 80 120, 80 140, 80\n";
	responseStream << "                C180, 80 180, 20  90, 80\n";
	responseStream << "                C 60,100  30,120  30,120\n";
	responseStream << "              \"></path>\n";
	responseStream << "            <path class=\"middle\" d=\"\n";
	responseStream << "                M 40,100\n";
	responseStream << "                L140,100\n";
	responseStream << "              \"></path>\n";
	responseStream << "            <path class=\"bottom\" d=\"\n";
	responseStream << "                M 40,120\n";
	responseStream << "                C 40,120 120,120 140,120\n";
	responseStream << "                C180,120 180,180  90,120\n";
	responseStream << "                C 60,100  30, 80  30, 80\n";
	responseStream << "              \"></path>\n";
	responseStream << "          </svg>\n";
	responseStream << "        </button>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"t-header-content-wrapper\">\n";
	responseStream << "        <div class=\"t-header-content\">\n";
	responseStream << "          <button class=\"t-header-toggler t-header-mobile-toggler d-block d-lg-none\">\n";
	responseStream << "            <i class=\"mdi mdi-menu\"></i>\n";
	responseStream << "          </button>\n";
	responseStream << "          <div class=\"flash-messages\" style=\"margin-left:20px; margin-top:30px;\">";
#line 51 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "</div>\n";
	responseStream << "        </div>\n";
	responseStream << "      </div>\n";
	responseStream << "    </nav>\n";
	responseStream << "    <div class=\"page-body\">\n";
	responseStream << "      <!-- partial:partials/_sidebar.html -->\n";
	responseStream << "      <div class=\"sidebar\">\n";
	responseStream << "        <ul class=\"navigation-menu\">\n";
	responseStream << "          <li>\n";
	responseStream << "            <a href=\"";
#line 60 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "state-balances/overview\" title=\"Kontoübersicht\">\n";
	responseStream << "              <span class=\"link-title\">Kontoübersicht (";
#line 61 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( TransactionBase::amountToString(userBalance) );
	responseStream << " GDD)</span>\n";
	responseStream << "              <i class=\"mdi mdi-wallet-outline link-icon\"></i>\n";
	responseStream << "            </a>\n";
	responseStream << "          </li>\n";
	responseStream << "          <li>\n";
	responseStream << "            <a href=\"";
#line 66 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">\n";
	responseStream << "              <span class=\"link-title\">Startseite</span>\n";
	responseStream << "              <i class=\"mdi mdi-gauge link-icon\"></i>\n";
	responseStream << "            </a>\n";
	responseStream << "          </li>\n";
	responseStream << "          <li>\n";
	responseStream << "            <a href=\"";
#line 72 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "transaction-send-coins/create\">\n";
	responseStream << "              <span class=\"link-title\">Überweisen</span>\n";
	responseStream << "              <i class=\"mdi mdi-bank-transfer-out link-icon\"></i>\n";
	responseStream << "            </a>\n";
	responseStream << "          </li>\n";
	responseStream << "        </ul>\n";
	responseStream << "      </div>\n";
	responseStream << "      <div class=\"page-content-wrapper\">\n";
	responseStream << "        <div class=\"page-content-wrapper-inner\">\n";
	responseStream << "          <div class=\"viewport-header\">\n";
	responseStream << "            <nav aria-label=\"breadcrumb\">\n";
	responseStream << "              <ol class=\"breadcrumb has-arrow\">\n";
	responseStream << "                <li class=\"breadcrumb-item\">\n";
	responseStream << "                  <a href=\"";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">Startseite</a>\n";
	responseStream << "                </li>\n";
	responseStream << "                <li class=\"breadcrumb-item active\" aria-current=\"page\">";
#line 87 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_navi.cpsp"
	responseStream << ( pageName );
	responseStream << "</li>\n";
	responseStream << "              </ol>\n";
	responseStream << "            </nav>\n";
	responseStream << "          </div>\n";
	responseStream << "          <div class=\"content-viewport\">";
	// end include header_navi.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"col-md-10 equel-grid mb-3\">\n";
	responseStream << "\t<small class=\"text-gray d-block mt-3\">\n";
	responseStream << "\t";
#line 73 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions > 0 && sumTransactions - notReadyTransactions != 1) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 74 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(notReadyTransactions > 0) { 	responseStream << " \n";
	responseStream << "\t\t\t";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions - notReadyTransactions );
	responseStream << " ";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("von") );
	responseStream << " ";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 75 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen sind bereit zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 76 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 77 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen warten darauf best&auml;tigt zu werden.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 79 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_NO_TRANSACTIONS) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 81 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es gibt zurzeit keine Transaktionen zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 83 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion(en) werden noch vorbereitet, bitte lade die Seite in wenigen Augenblicken erneut.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "    ";
#line 86 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</small>\n";
	responseStream << "</div>\n";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(state != PAGE_NO_TRANSACTIONS) { 	responseStream << "\n";
	responseStream << "<div class=\"col-md-10 equel-grid\">\n";
	responseStream << "\t<div class=\"grid\">\n";
	responseStream << "\t  <p class=\"grid-header\">";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion Unterzeichnen") );
	responseStream << "</p>\n";
	responseStream << "\t  <div class=\"grid-body\">\n";
	responseStream << "\t\t<div class=\"item-wrapper\">\n";
	responseStream << "\t\t  <div class=\"row mb-3\">\n";
	responseStream << "\t\t\t<div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t\t";
#line 97 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_TRANSACTION_TRANSFER) { 
				auto transferTransaction = processingTransaction->getTransferTransaction();
				memo = transferTransaction->getMemo();
				responseStream << "\n";
	responseStream << "\t\t\t  <p class=\"card-title ml-n1 mb-3\">";
#line 101 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("&Uuml;berweisung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t  <div class=\"table-responsive mb-4\">\n";
	responseStream << "\t\t\t\t<table class=\"table info-table table-striped table-bordered\">\n";
	responseStream << "\t\t\t\t  <thead>\n";
	responseStream << "\t\t\t\t\t<tr><th>";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</th><th>";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</th></tr>\n";
	responseStream << "\t\t\t\t  </thead>\n";
	responseStream << "\t\t\t\t  <tbody>\n";
	responseStream << "\t\t\t\t  ";
#line 108 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 for(int i = 0; i < transferTransaction->getKontoTableSize(); i++) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<tr>\n";
	responseStream << "\t\t\t\t\t\t";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getKontoNameCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 111 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getAmountCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t</tr>\n";
	responseStream << "\t\t\t\t\t";
#line 113 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t  </tbody>\n";
	responseStream << "\t\t\t\t</table>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  \n";
	responseStream << "\t\t\t  ";
#line 118 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else if(state == PAGE_TRANSACTION_CREATION) { 
					auto creationTransaction = processingTransaction->getCreationTransaction();
					auto transactionUser = creationTransaction->getUser();
					memo = creationTransaction->getMemo();
			  	responseStream << "\n";
	responseStream << "\t\t\t  <p class=\"card-title ml-n1 mb-3\">";
#line 123 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Sch&ouml;pfung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t  <div class=\"table-responsive mb-4\">\n";
	responseStream << "\t\t\t\t<table class=\"table info-table table-striped table-bordered\">\n";
	responseStream << "\t\t\t\t  <thead>\n";
	responseStream << "\t\t\t\t\t<tr><th>";
#line 127 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</th><th>";
#line 127 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</th></tr>\n";
	responseStream << "\t\t\t\t  </thead>\n";
	responseStream << "\t\t\t\t  <tbody>\n";
	responseStream << "\t\t\t\t\t<tr>\n";
	responseStream << "\t\t\t\t\t\t";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(transactionUser) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<td>";
#line 132 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getFirstName() );
	responseStream << " ";
#line 132 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getLastName() );
	responseStream << " &lt;";
#line 132 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getEmail() );
	responseStream << "&gt;</td>\n";
	responseStream << "\t\t\t\t\t\t";
#line 133 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t\t<td class=\"small\">0x";
#line 134 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getPublicHex() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t\t\t";
#line 135 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<td class=\"grd-success-color\">";
#line 136 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getAmountString() );
	responseStream << " GDD</td>\n";
	responseStream << "\t\t\t\t\t</tr>\n";
	responseStream << "\t\t\t\t  </tbody>\n";
	responseStream << "\t\t\t\t</table>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  ";
#line 141 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t  <div class=\"table-responsive mb-4\">\n";
	responseStream << "\t\t\t\t<table class=\"table info-table table-bordered table-auto-break\">\n";
	responseStream << "\t\t\t\t  <thead><tr><th>";
#line 144 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Aktives Konto") );
	responseStream << "</th></tr></thead>\n";
	responseStream << "\t\t\t\t  <tbody><tr><td>";
#line 145 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getFirstName() );
	responseStream << " ";
#line 145 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getLastName() );
	responseStream << " &lt;";
#line 145 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getEmail() );
	responseStream << "&gt;</td></tr></tbody>\n";
	responseStream << "\t\t\t\t</table>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  <div class=\"table-responsive mb-4\">\n";
	responseStream << "\t\t\t\t<table class=\"table info-table table-bordered table-auto-break tab-container\">\n";
	responseStream << "\t\t\t\t  <thead><tr><th>";
#line 150 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Verwendungszweck") );
	responseStream << "</th></tr></thead>\n";
	responseStream << "\t\t\t\t  <tbody><tr>\n";
	responseStream << "\t\t\t\t\t  <td class=\"tab-content\">";
#line 152 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( memo );
	responseStream << "</td></tr></tbody>\n";
	responseStream << "\t\t\t\t</table>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t  </div>\n";
	responseStream << "\t\t\t<form>\n";
	responseStream << "\t\t\t  <div class=\"row mb-3\">\n";
	responseStream << "\t\t\t\t<div class=\"col-md-10 mx-auto\">\n";
	responseStream << "\t\t\t\t ";
#line 160 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(!accountUser->hasCryptoKey()) {	responseStream << "\n";
	responseStream << "\t\t\t\t <div class=\"form-group\">\n";
	responseStream << "\t\t\t\t\t  <label for=\"sign-password\">";
#line 162 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Ich brauche nochmal dein Passwort") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t  <input type=\"password\" class=\"form-control\" id=\"sign-password\" name=\"sign-password\" placeholder=\"";
#line 163 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Passwort") );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t </div>\n";
	responseStream << "\t\t\t\t";
#line 165 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t  <button type=\"submit\" class=\"btn btn-sm btn-primary\" name=\"ok\" value=\"ok\">\n";
	responseStream << "\t\t\t\t\t<i class=\"mdi mdi-signature-freehand\"></i>\n";
	responseStream << "\t\t\t\t\t";
#line 168 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion unterzeichnen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t  </button>\n";
	responseStream << "\t\t\t\t  <button type=\"submit\" class=\"btn btn-sm btn-warning\" name=\"abort\" value=\"abort\">\n";
	responseStream << "\t\t\t\t\t<i class=\"mdi mdi-delete\"></i>\n";
	responseStream << "\t\t\t\t\t";
#line 172 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion verwerfen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t  </button>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t  </div>\n";
	responseStream << "\t</div>\n";
	responseStream << "</div>\n";
#line 181 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	// begin include footer_ripple.cpsp
	responseStream << "\t</div>\n";
	responseStream << "        </div>\n";
	responseStream << "        <!-- content viewport ends -->\n";
	responseStream << "        <!-- partial:partials/_footer.html -->\n";
	responseStream << "        <footer class=\"footer\">\n";
	responseStream << "          <div class=\"row\">\n";
	responseStream << "            <div class=\"col-sm-6 text-center text-sm-right order-sm-1\">\n";
	responseStream << "              <ul class=\"text-gray\">\n";
	responseStream << "                <li><a href=\"#\">Terms of use</a></li>\n";
	responseStream << "                <li><a href=\"#\">Privacy Policy</a></li>\n";
	responseStream << "              </ul>\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"col-sm-6 text-center text-sm-left mt-3 mt-sm-0\">\n";
	responseStream << "              <small class=\"text-muted d-block\">Copyright © 2019 Gradido</small>\n";
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
