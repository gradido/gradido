#include "CheckTransactionPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/EmailManager.h"
#include "../model/TransactionCreation.h"
#include "../model/TransactionTransfer.h"

#include "Poco/Thread.h"

enum PageState {
	PAGE_TRANSACTION_CREATION,
	PAGE_TRANSACTION_TRANSFER,
	PAGE_NO_TRANSACTIONS,
	PAGE_USER_DATA_CORRUPTED
};



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
#line 24 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 
	const char* pageName = gettext("&Uuml;berpr&uuml;fe Transaktion");
	auto account_user = mSession->getNewUser();
	auto user_model = account_user->getModel();
	auto em = EmailManager::getInstance();
	auto userBalance = account_user->getBalance();
	std::string memo = "";
	bool hasErrors = false;
	bool enableLogout = true;
	
	PageState state = PAGE_NO_TRANSACTIONS;
	
	if(!user_model->isEmailChecked()) {
		addError(new Error(gettext("E-Mail Aktivierung"), gettext("E-Mail wurde noch nicht aktiviert, du kannst leider noch keine Transaktionen ausführen!")));
		hasErrors = true;
	}
	
	bool transaction_finalize_run = false;
	bool transaction_finalize_result = false;
	
	if(!form.empty()) {
		auto ok = form.get("ok", "");
		auto abort = form.get("abort", "");
		auto back = form.get("back", "");
		if(abort != "") {
			transaction_finalize_result = mSession->finalizeTransaction(false, true);
			transaction_finalize_run = true;
		} else if(ok != "") {
			if(!account_user->hasPassword()) {
				auto pwd = form.get("sign-password", "");
				auto loginResult = account_user->login(pwd);
				switch(loginResult) {
				case 0: 
					addError(new Error(gettext("Passwort"), gettext("Das Passwort stimmt nicht. Bitte verwende dein Passwort von der Registrierung")));
					hasErrors = true;
					break;
				case -1: 
				case -2:
					addError(new Error(gettext("Passwort"), gettext("Gespeicherte Daten sind korrupt!")));
					hasErrors = true;
					state = PAGE_USER_DATA_CORRUPTED;
					break;
				case -3: 
					addError(new Error(gettext("Passwort"), gettext("Passwortprüfung läuft schon, bitte versuche es in 1-2 Minuten erneut.")));
					hasErrors = true;
					break;
				}
			}
			if(!hasErrors) {
				transaction_finalize_result = mSession->finalizeTransaction(true, false);
				transaction_finalize_run = true;
			}
		} else if(back == "back") {
			auto lastExternReferer = mSession->getLastReferer();
			//lastExternReferer = "";
			if(lastExternReferer != "" && lastExternReferer.find("transaction-send-coins") == std::string::npos) {
				//printf("last extern referer: %s\n", lastExternReferer.data());
				response.redirect(lastExternReferer);
			} else {
				response.redirect(ServerConfig::g_php_serverPath + "state-balances/overview");
			}
			return;
		}
	}
	
	
	size_t notReadyTransactions = 0;
	size_t sumTransactions = mSession->getProcessingTransactionCount();
	if(sumTransactions == 0 && !transaction_finalize_run) {
		/*auto observer = SingletonTaskObserver::getInstance();
		auto emailHash = DRMakeStringHash(mSession->getUser()->getEmail());
		int breakCount = 0;
		while(observer->getTaskCount(emailHash, TASK_OBSERVER_SIGN_TRANSACTION) > 0) {
			if(breakCount > 100) break;
			breakCount++;
			Poco::Thread::sleep(10);
		}*/
		auto lastExternReferer = mSession->getLastReferer();
		//lastExternReferer = "";
		if(lastExternReferer != "" && lastExternReferer.find("transaction-send-coins") == std::string::npos) {
			//printf("last extern referer: %s\n", lastExternReferer.data());
			response.redirect(lastExternReferer);
		} else {
			response.redirect(ServerConfig::g_php_serverPath + "state-balances/overview");
		}
		return;
	}
	auto processingTransaction = mSession->getNextReadyTransaction(&notReadyTransactions);
	if(sumTransactions > 0) {
		enableLogout = false;
	}
	if(PAGE_NO_TRANSACTIONS == state && !processingTransaction.isNull()) {
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
	// begin include header_navi_chr.cpsp
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "\n";
	responseStream << "<head>\n";
	responseStream << "    <meta charset=\"UTF-8\">\n";
	responseStream << "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\">\n";
	responseStream << "    <title>Gradido Login Server: ";
#line 7 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "    <link href=\"";
#line 8 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "favicon.ico\" type=\"image/x-icon\" rel=\"icon\" />\n";
	responseStream << "    <link href=\"";
#line 9 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "favicon.ico\" type=\"image/x-icon\" rel=\"shortcut icon\" />\n";
	responseStream << "    <link rel=\"stylesheet\" href=\"";
#line 10 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "css/main.css\" />\n";
	responseStream << "    <script src=\"";
#line 11 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "js/basic.js\"></script>\n";
	responseStream << "</head>\n";
	responseStream << "\n";
	responseStream << "<body>\n";
	responseStream << "    <div class=\"layout\">\n";
	responseStream << "        <div class=\"header-notify\">\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"sidebar1 nav-menu initial\">\n";
	responseStream << "            <a href=\"";
#line 19 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">\n";
	responseStream << "                <picture class=\"logo big visible\">\n";
	responseStream << "                    <source srcset=\"";
#line 21 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift_half.webp\" type=\"image/webp\">\n";
	responseStream << "                    <source srcset=\"";
#line 22 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift_half.png\" type=\"image/png\">\n";
	responseStream << "                    <img src=\"";
#line 23 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_schrift_half.png\" class=\"logo big visible\" alt=\"Logo\">\n";
	responseStream << "                </picture>\n";
	responseStream << "                <picture class=\"logo small\">\n";
	responseStream << "                    <source srcset=\"";
#line 26 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_half.webp\" type=\"image/webp\">\n";
	responseStream << "                    <source srcset=\"";
#line 27 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_half.png\" type=\"image/png\">\n";
	responseStream << "                    <img src=\"";
#line 28 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "img/logo_half.png\" class=\"logo small\" alt=\"Logo\">\n";
	responseStream << "                </picture>\n";
	responseStream << "            </a>\n";
	responseStream << "            <div>\n";
	responseStream << "                <i class=\"material-icons-outlined nav-main-button\">menu</i>\n";
	responseStream << "            </div>\n";
	responseStream << "            <div class=\"flash-messages\" onclick=\"this.classList.add('hidden')\">";
#line 34 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( getErrorsHtmlNewFormat() );
	responseStream << "</div>\n";
	responseStream << "            <div class=\"nav-vertical\">\n";
	responseStream << "                <ul>\n";
	responseStream << "                    <li><a href=\"";
#line 37 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "state-balances/overview\" class=\"\"><i class=\"material-icons-outlined nav-icon \" title=\"Kontoübersicht (  ";
#line 37 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( TransactionBase::amountToString(userBalance) );
	responseStream << " GDD )\">account_balance_wallet</i><span\n";
	responseStream << "                                class=\"link-title\">Kontoübersicht ( ";
#line 38 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( TransactionBase::amountToString(userBalance) );
	responseStream << " GDD )</span></a></li>\n";
	responseStream << "                    <li><a href=\"";
#line 39 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "dashboard/index\" class=\"\"><i class=\"material-icons-outlined nav-icon \" title=\"Startseite\">home</i><span\n";
	responseStream << "                                class=\"link-title\">Startseite</span></a></li>\n";
	responseStream << "                    <li class=' selected'><a href=\"";
#line 41 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "transaction-send-coins/create\" class=\"\"><i class=\"material-icons-outlined nav-icon \"\n";
	responseStream << "                                title=\"Überweisung\">account_balance</i><span class=\"link-title\">Überweisung</span></a></li>\n";
	responseStream << "                    <li><a href=\"https://elopage.com/s/gradido/sign_in\" class=\"\" target=\"_blank\"><i class=\"material-icons-outlined nav-icon \"\n";
	responseStream << "                                title=\"Mitgliederbereich\">people_alt</i><span class=\"link-title\">Mitgliederbereich</span></a></li>\n";
	responseStream << "                </ul>\n";
	responseStream << "            </div>\n";
	responseStream << "        </div>\n";
	responseStream << "        <div class=\"content\">\n";
	responseStream << "            <div class=\"nav-content\">\n";
	responseStream << "                <ul class='nav-content-list'>\n";
	responseStream << "                    <li><a href=\"/\" class=\"\"><span class=\"link-title\">Startseite</span></a></li>\n";
	responseStream << "                    <li class='nav-content-separator'>-</li>\n";
	responseStream << "                    <li class='selected'><span class=\"link-title\">";
#line 53 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\header_navi_chr.cpsp"
	responseStream << ( pageName );
	responseStream << "</span></li>\n";
	responseStream << "                </ul>\n";
	responseStream << "            </div>";
	// end include header_navi_chr.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"col-md-10 equel-grid mb-3\">\n";
	responseStream << "\t<small class=\"text-gray d-block mt-3\">\n";
	responseStream << "\t";
#line 128 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions > 0 && sumTransactions - notReadyTransactions != 1) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 129 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(notReadyTransactions > 0) { 	responseStream << " \n";
	responseStream << "\t\t\t";
#line 130 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions - notReadyTransactions );
	responseStream << " ";
#line 130 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("von") );
	responseStream << " ";
#line 130 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 130 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen sind bereit zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 131 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 132 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 132 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen warten darauf best&auml;tigt zu werden.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 133 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 134 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 135 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_NO_TRANSACTIONS) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 136 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 137 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es gibt zurzeit keine Transaktionen zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 138 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 139 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion(en) werden noch vorbereitet, bitte lade die Seite in wenigen Augenblicken erneut.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 140 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "    ";
#line 141 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</small>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"content-container main-container\">\n";
#line 145 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction_finalize_run) { 	responseStream << "\n";
	responseStream << "\t<div class=\"col-md-10 equel-grid mb-3\">\n";
	responseStream << "\t\t<div class=\"flash-messages\" onclick=\"this.classList.add('hidden')\">\n";
	responseStream << "\t\t\t<ul class='grd-no-style'>\n";
	responseStream << "\t\t\t\t";
#line 149 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction_finalize_result) { 	responseStream << " \n";
	responseStream << "\t\t\t\t\t<li class='grd-success'>Transaktion erfolgreich</li>\n";
	responseStream << "\t\t\t\t";
#line 151 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<li class='grd-error'>Transaktion fehlgeschlagen</li>\n";
	responseStream << "\t\t\t\t";
#line 153 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</ul>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
#line 157 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t<div class=\"action-form\">\n";
	responseStream << "\t\t<p class=\"form-header\">";
#line 159 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion Unterzeichnen") );
	responseStream << "</p>\n";
	responseStream << "\t\t<div class=\"form-content\">\n";
	responseStream << "\t\t";
#line 161 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_TRANSACTION_TRANSFER) { 
			auto transferTransaction = processingTransaction->getTransferTransaction();
			memo = transferTransaction->getMemo();
			responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 165 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("&Uuml;berweisung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 168 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 169 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  ";
#line 171 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 for(int i = 0; i < transferTransaction->getKontoTableSize(); i++) { 	responseStream << "\t\t\t\t\t\n";
	responseStream << "\t\t\t\t\t";
#line 172 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if((i+1) % 2 == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<div class=\"content-row content-row\">\n";
	responseStream << "\t\t\t\t\t";
#line 174 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t\t";
#line 176 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 177 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getKontoNameCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 178 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getAmountCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t  ";
#line 180 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t ";
#line 182 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else if(PAGE_TRANSACTION_CREATION == state) { 
					auto creationTransaction = processingTransaction->getCreationTransaction();
					auto transactionUser = creationTransaction->getUser();
					memo = creationTransaction->getMemo();
			 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>";
#line 187 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Sch&ouml;pfung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 190 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 191 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Zieldatum") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 192 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t\t";
#line 195 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(transactionUser) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<span class=\"content-cell\">";
#line 196 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getFirstName() );
	responseStream << " ";
#line 196 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getLastName() );
	responseStream << " &lt;";
#line 196 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getEmail() );
	responseStream << "&gt;</span>\n";
	responseStream << "\t\t\t\t\t";
#line 197 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<span class=\"content-cell\">0x";
#line 198 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getPublicHex() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t";
#line 199 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 200 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getTargetDateString() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell success-color\">";
#line 201 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getAmountString() );
	responseStream << " GDD</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t ";
#line 204 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else if(PAGE_USER_DATA_CORRUPTED == state) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p class=\"alert-color\">";
#line 205 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es gibt ein Problem mit deinen gespeicherten Daten, bitte wende dich an den"));
	responseStream << "<a href=\"mailto:";
#line 205 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( em->getAdminReceiver());
	responseStream << "?subject=Corrupt User Data&amp;body=Hallo Dario,%0D%0A%0D%0Ameine Benutzer Daten sind korrupt.%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">";
#line 205 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << (gettext("Support") );
	responseStream << "</a></p>\n";
	responseStream << "\t\t\t ";
#line 206 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">Aktives Konto</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  <div class=\"content-row\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 212 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user_model->getNameWithEmailHtml() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">Verwendungszweck</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  <div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 220 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( memo );
	responseStream << "</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t<form>\n";
	responseStream << "\t\t\t\t";
#line 224 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(!account_user->hasPassword()) {	responseStream << "\n";
	responseStream << "\t\t\t\t <div class=\"form-group\">\n";
	responseStream << "\t\t\t\t\t  <label for=\"sign-password\">";
#line 226 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Ich brauche nochmal dein Passwort") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t  <input type=\"password\" class=\"form-control\" id=\"sign-password\" name=\"sign-password\" placeholder=\"";
#line 227 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Passwort") );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t </div>\n";
	responseStream << "\t\t\t\t";
#line 229 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t";
#line 230 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(PAGE_USER_DATA_CORRUPTED != state && user_model->isEmailChecked()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<button type=\"submit\" class=\"form-button\" name=\"ok\" value=\"ok\">\n";
	responseStream << "\t\t\t\t\t\t<i class=\"material-icons-outlined\">verified_user</i>\n";
	responseStream << "\t\t\t\t\t\t";
#line 233 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion unterzeichnen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t";
#line 235 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t<button type=\"submit\" class=\"form-button button-cancel\" name=\"abort\" value=\"abort\">\n";
	responseStream << "\t\t\t\t\t<i class=\"material-icons-outlined\">delete</i>\n";
	responseStream << "\t\t\t\t\t";
#line 238 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion verwerfen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t";
#line 240 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<button type=\"submit\" class=\"form-button button-cancel\" name=\"back\" value=\"back\">\n";
	responseStream << "\t\t\t\t\t\t<i class=\"material-icons-outlined\">back</i>\n";
	responseStream << "\t\t\t\t\t\tZur&uuml;ck\n";
	responseStream << "\t\t\t\t\t</button>\t\n";
	responseStream << "\t\t\t\t";
#line 245 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</div>\n";
	responseStream << "</div>\n";
	// begin include footer_chr.cpsp
	responseStream << "</div>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"footer\">\n";
	responseStream << "        <ul class=\"nav-horizontal\">\n";
	responseStream << "            <li><a href=\"https://gradido.net/de/datenschutz/\" target=\"_blank\">Datenschutzerklärung</a></li>\n";
	responseStream << "            <li><a href=\"https://gradido.net/de/impressum/\" target=\"_blank\">Impressum</a></li>\n";
	responseStream << "        </ul>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"nav-bottom\">\n";
	responseStream << "        <small class=\"\">Copyright © 2020 Gradido</small>\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"bottomleft\">\n";
	responseStream << "        ";
#line 13 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\footer_chr.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "    </div>\n";
	responseStream << "    <div class=\"bottomright\">\n";
	responseStream << "        <p>Community Server in Entwicklung</p>\n";
	responseStream << "        <p>Alpha ";
#line 17 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\footer_chr.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "    </div>\n";
	responseStream << "    </div>\n";
	responseStream << "</body>\n";
	responseStream << "\n";
	responseStream << "</html>";
	// end include footer_chr.cpsp
	if (_compressResponse) _gzipStream.close();
}
