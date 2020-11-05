#include "CheckTransactionPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/EmailManager.h"
#include "../SingletonManager/PendingTasksManager.h"
#include "../model/gradido/TransactionCreation.h"
#include "../model/gradido/TransactionTransfer.h"

#include "../lib/DataTypeConverter.h"

#include "Poco/Thread.h"

enum PageState {
	PAGE_TRANSACTION_CREATION,
	PAGE_TRANSACTION_TRANSFER,
	PAGE_TRANSACTION_GROUP_ADD_MEMBER,
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
	auto pt = PendingTasksManager::getInstance();
	auto userBalance = account_user->getBalance();
	std::string memo = "";
	bool hasErrors = false;
	bool enableLogout = true;
	int skip_count = 0;
	int pending_task_id = 0;
	
	PageState state = PAGE_NO_TRANSACTIONS;
	
	if(!user_model->isEmailChecked()) {
		addError(new Error(gettext("E-Mail Aktivierung"), gettext("E-Mail wurde noch nicht aktiviert, du kannst leider noch keine Transaktionen ausführen!")));
		hasErrors = true;
	}

	bool transaction_finalize_run = false;
	bool transaction_finalize_result = false;
	auto transactions_to_sign = pt->getTransactionsUserMustSign(account_user);
	
	//Poco::AutoPtr<controller::PendingTask> pending_task;
	model::gradido::Transaction* transaction = nullptr;
	Poco::AutoPtr<model::gradido::TransactionBody> transaction_body;
	
	if(!form.empty()) 
	{
		transaction = dynamic_cast<model::gradido::Transaction*>(transactions_to_sign[0].get());
		transaction_body = transaction->getTransactionBody();

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
		auto pending_task_id_string = form.get("pending-task-id", "");
		int pending_task_id = 0;
		if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(pending_task_id_string, pending_task_id)) 
		{
			// make sure we have the correct transaction
			transaction = nullptr;
			printf("transaction_body isNull: %d\n", transaction_body.isNull());
			transaction_body.assign(nullptr);
			for(auto it = transactions_to_sign.begin(); it != transactions_to_sign.end(); it++) 
			{
				if((*it)->getModel()->getID() == pending_task_id) {
					transaction = dynamic_cast<model::gradido::Transaction*>(it->get());
					transaction_body = transaction->getTransactionBody();
					printf("set new transaction and transaction_body\n");
					break;
				}
			}
			if(abort != "")
		/*
		auto ok = form.get("ok", "");
		auto abort = form.get("abort", "");
		auto skip = form.get("skip", "");
		auto skip_count_str = form.get("skip-count", "0");
		auto pending_task_id_string = form.get("pending-task-id", "");
		DataTypeConverter::strToInt(skip_count_str, skip_count);
		
		if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(pending_task_id_string, pending_task_id)) 
		{
			// load transaction from pending task manager
			pending_task = pt->getPendingTask(pending_task_id);
			if(!pending_task.isNull() && pending_task->getModel()->isGradidoTransaction())
		*/
			{
				transaction = dynamic_cast<model::gradido::Transaction*>(pending_task.get());
				if(transaction->hasSigned(account_user)) {
					transaction = nullptr;
				} else {				
					transaction_body = transaction->getTransactionBody();
				}
			
				if(abort != "") 
				{
					//mSession->finalizeTransaction(false, true);
					// 
					if(transaction && transaction->getModel()->getUserId() == user_model->getID()) 
					{
						transaction->deleteFromDB();
						transaction = nullptr;
					}
				} 
				else if(ok != "") 
				{
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
						//mSession->finalizeTransaction(true, false);
						if(transaction && transaction->sign(account_user)) {
							transaction = nullptr;
						}
					}
				}
				else if(skip != "")
				{
					skip_count++;
					transaction = nullptr;
				}
			} else {
				addError(new Error(gettext("Input Error"), gettext("Task no found")));
			}
		} else {
			addError(new Error(gettext("Form Error"), gettext("error with field")));
		}
	}
	
	auto transactions_user_must_sign = pt->getTransactionsUserMustSign(account_user);
	std::vector<Poco::AutoPtr<controller::PendingTask>> transactions_someone_must_sign;
	// TODO: work with community server roles
	if(user_model->getRole() == model::table::ROLE_ADMIN) {
	  transactions_someone_must_sign = pt->getTransactionSomeoneMustSign(account_user);	
	}
	std::vector<Poco::AutoPtr<controller::PendingTask>>  transactions_to_sign;
	bool transaction_removeable = false;
	int transaction_to_sign_index = 0;
	if(!transaction) 
	{
		if(transactions_user_must_sign.size() > skip_count) {
			transactions_to_sign = transactions_user_must_sign;
			transaction_to_sign_index = skip_count;
		} else if(transactions_someone_must_sign.size() > (skip_count - transactions_user_must_sign.size())) {
			transactions_to_sign = transactions_someone_must_sign;
			transaction_to_sign_index = skip_count - transactions_user_must_sign.size();
		}
		
		if(transactions_to_sign.size() > transaction_to_sign_index) 
		{
			transaction = dynamic_cast<model::gradido::Transaction*>(transactions_to_sign[transaction_to_sign_index].get());
			transaction_body = transaction->getTransactionBody();
			// user can only delete there own transactions
			// TODO: Auto timeout for community transactions
			if(transaction->getModel()->getUserId() == user_model->getID()) {
				transaction_removeable = true;
			}
		}
	}
	size_t sumTransactions = transactions_user_must_sign.size() + transactions_someone_must_sign.size();
	if(sumTransactions == 0) 
	{
		auto lastExternReferer = mSession->getLastReferer();
		//lastExternReferer = "";
		account_user->reload();
		if(lastExternReferer != "" && lastExternReferer.find("transaction-send-coins") == std::string::npos) {
			//printf("last extern referer: %s\n", lastExternReferer.data());
			response.redirect(lastExternReferer);
		} else if(!account_user->getModel()->getGroupId()) {
			response.redirect(ServerConfig::g_serverPath + "/userUpdateGroup");
		} else {
			response.redirect(account_user->getGroupBaseUrl() + "state-balances/overview");
		}
		return;
	}
	
	if(transactions_user_must_sign.size() > 0) 
	{
		enableLogout = false;
	}
	if(PAGE_NO_TRANSACTIONS == state && transaction && !transaction_body.isNull()) 
	{
		auto transactionType = transaction_body->getType();
		memo = transaction_body->getMemo();
		switch(transactionType) {
			case model::gradido::TRANSACTION_CREATION: state = PAGE_TRANSACTION_CREATION; break;
			case model::gradido::TRANSACTION_TRANSFER: state = PAGE_TRANSACTION_TRANSFER; break;
			case model::gradido::TRANSACTION_GROUP_MEMBER_UPDATE: state = PAGE_TRANSACTION_GROUP_ADD_MEMBER; break;
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
#line 126 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction_finalize_run) { 	responseStream << "\n";
	responseStream << "<div class=\"col-md-10 equel-grid mb-3\">\n";
	responseStream << "\t<div class=\"flash-messages\" style=\"background-color: rgba(240,240,240,0.8);\" onclick=\"this.classList.add('hidden')\">\n";
	responseStream << "\t\t<ul class='grd-no-style'>\n";
	responseStream << "\t\t\t";
#line 130 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction_finalize_result) { 	responseStream << " \n";
	responseStream << "\t\t\t\t<li class='grd-success'>Transaktion erfolgreich</li>\n";
	responseStream << "\t\t\t";
#line 132 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t<li class='grd-error'>Transaktion fehlgeschlagen</li>\n";
	responseStream << "\t\t\t";
#line 134 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</div>\n";
#line 138 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "<div class=\"col-md-10 equel-grid mb-3\">\n";
	responseStream << "\t<small class=\"text-gray d-block mt-3\">\n";
	responseStream << "\t";
#line 141 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions > 0 && sumTransactions - notReadyTransactions != 1) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 142 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(notReadyTransactions > 0) { 	responseStream << " \n";
	responseStream << "\t\t\t";
#line 143 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions - notReadyTransactions );
	responseStream << " ";
#line 143 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("von") );
	responseStream << " ";
#line 143 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 143 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen sind bereit zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 144 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 145 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " ";
#line 145 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktionen warten darauf best&auml;tigt zu werden.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 146 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 147 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 148 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_NO_TRANSACTIONS) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 149 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 150 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es gibt zurzeit keine Transaktionen zum best&auml;tigen") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 151 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 152 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion(en) werden noch vorbereitet, bitte lade die Seite in wenigen Augenblicken erneut.") );
	responseStream << "\n";
	responseStream << "\t\t";
#line 153 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "    ";
#line 154 "F:\\Gradido\\gradido_login_server_production\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</small>\n";
	responseStream << "</div>\n";
	responseStream << "<div class=\"content-container main-container\">\n";
	responseStream << "\t<div class=\"action-form\">\n";
	responseStream << "\t\t<p class=\"form-header\">";
#line 205 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion Unterzeichnen") );
	responseStream << "</p>\n";
	responseStream << "\t\t<div class=\"form-content\">\n";
	responseStream << "\t\t";
#line 207 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_TRANSACTION_TRANSFER) { 
			auto transferTransaction = transaction_body->getTransferTransaction();
			responseStream << "\n";
	responseStream << "\t\t\t<p>";
#line 210 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("&Uuml;berweisung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 213 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t<span class=\"content-cell\">";
#line 214 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t  </div>\n";
	responseStream << "\t\t\t  ";
#line 216 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 for(int i = 0; i < transferTransaction->getKontoTableSize(); i++) { 	responseStream << "\t\t\t\t\t\n";
	responseStream << "\t\t\t\t\t";
#line 217 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if((i+1) % 2 == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<div class=\"content-row content-row\">\n";
	responseStream << "\t\t\t\t\t";
#line 219 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t\t";
#line 221 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 222 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getKontoNameCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t";
#line 223 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transferTransaction->getAmountCell(i) );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t</div>\n";
	responseStream << "\t\t\t  ";
#line 225 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t ";
#line 227 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else if(PAGE_TRANSACTION_CREATION == state) { 
					auto creationTransaction = transaction_body->getCreationTransaction();
					auto transactionUser = creationTransaction->getUser();
			 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>";
#line 231 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Sch&ouml;pfung") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 234 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Konto") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 235 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Zieldatum") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 236 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gradido") );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t\t";
#line 239 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(!transactionUser.isNull()) { 
	auto user_model = transactionUser->getModel();
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<span class=\"content-cell\">";
#line 242 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user_model->getFirstName() );
	responseStream << " ";
#line 242 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user_model->getLastName() );
	responseStream << " &lt;";
#line 242 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user_model->getEmail() );
	responseStream << "&gt;</span>\n";
	responseStream << "\t\t\t\t\t";
#line 243 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<span class=\"content-cell\">0x";
#line 244 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getPublicHex() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t";
#line 245 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 246 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getTargetDateString() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell success-color\">";
#line 247 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getAmountString() );
	responseStream << " GDD</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t     ";
#line 250 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else if(PAGE_TRANSACTION_GROUP_ADD_MEMBER == state) { 
				auto groupMemberUpdateTransaction = transaction_body->getGroupMemberUpdate();
				auto groups = controller::Group::load(groupMemberUpdateTransaction->getTargetGroupAlias());
				Poco::AutoPtr<model::table::Group> group_model;
				Poco::AutoPtr<controller::User> user;
				if(groups.size() == 1 && !groups[0].isNull()) group_model = groups[0]->getModel();
				auto user_id = transaction->getModel()->getUserId();
				if(user_id == user_model->getID()) {
					user = account_user;
				} else {
					user = controller::User::sload(user_id);
				}
			 	responseStream << "\n";
	responseStream << "\t\t\t <p>";
#line 263 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Benutzer zu einer Gruppe hinzufügen") );
	responseStream << "</p>\n";
	responseStream << "\t\t\t <div class=\"content-table\">\n";
	responseStream << "\t\t\t\t<p>";
#line 265 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(!user.isNull()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<b>Benutzer:</b>&nbsp;";
#line 266 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user->getEmailWithNames() );
	responseStream << "\n";
	responseStream << "\t\t\t\t";
#line 267 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<b>Account public key:</b>&nbsp;";
#line 268 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( groupMemberUpdateTransaction->getPublicKeyHex() );
	responseStream << "\n";
	responseStream << "\t\t\t\t";
#line 269 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "</p>\n";
	responseStream << "\t\t\t\t";
#line 270 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(!group_model.isNull()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<p><b>";
#line 271 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Gruppe") );
	responseStream << ":</b></p>\n";
	responseStream << "\t\t\t\t\t<ul>\n";
	responseStream << "\t\t\t\t\t\t<li>";
#line 273 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Name") );
	responseStream << ": ";
#line 273 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t\t\t\t<li>";
#line 274 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Alias") );
	responseStream << ": ";
#line 274 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( group_model->getAlias() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t\t\t\t<li>";
#line 275 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Url") );
	responseStream << ": <a href=\"";
#line 275 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( group_model->getUrl() );
	responseStream << "/pages/visitor\" target=\"_blank\">";
#line 275 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( group_model->getUrl() );
	responseStream << "</a></li>\n";
	responseStream << "\t\t\t\t\t\t<li>";
#line 276 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( group_model->getDescription() );
	responseStream << "</li>\n";
	responseStream << "\t\t\t\t\t</ul>\n";
	responseStream << "\t\t\t\t";
#line 278 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t";
#line 279 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Unbekannte Gruppe") );
	responseStream << "\n";
	responseStream << "\t\t\t\t";
#line 280 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t";
#line 281 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es haben bereits ") );
#line 281 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( std::to_string(transaction->getSignCount()) );
#line 281 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext(" unterzeichnet") );
	responseStream << "\n";
	responseStream << "\t\t\t </div>\n";
	responseStream << "\t\t\t \n";
	responseStream << "\t\t\t ";
#line 284 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else if(PAGE_USER_DATA_CORRUPTED == state) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p class=\"alert-color\">";
#line 285 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Es gibt ein Problem mit deinen gespeicherten Daten, bitte wende dich an den"));
	responseStream << "<a href=\"mailto:";
#line 285 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( em->getAdminReceiver());
	responseStream << "?subject=Corrupt User Data&amp;body=Hallo Dario,%0D%0A%0D%0Ameine Benutzer Daten sind korrupt.%0D%0Akannst du das prüfen?%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A\">";
#line 285 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << (gettext("Support") );
	responseStream << "</a></p>\n";
	responseStream << "\t\t\t ";
#line 286 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t ";
#line 287 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(PAGE_NO_TRANSACTIONS == state) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<a href=\"";
#line 288 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\">";
#line 288 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Zur&uuml;ck") );
	responseStream << "</a>\n";
	responseStream << "\t\t\t ";
#line 289 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">Aktives Konto</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t  <div class=\"content-row\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 295 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( user_model->getNameWithEmailHtml() );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<div class=\"content-table\">\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-header\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">Verwendungszweck</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t  <div class=\"content-row content-row-bg\">\n";
	responseStream << "\t\t\t\t\t<span class=\"content-cell\">";
#line 303 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( memo );
	responseStream << "</span>\n";
	responseStream << "\t\t\t\t  </div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t\t<form>\n";
	responseStream << "\t\t\t\t\t";
#line 307 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<input type=\"hidden\" name=\"pending-task-id\" value=\"";
#line 308 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transaction->getModel()->getID() );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t";
#line 309 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<input type=\"hidden\" name=\"skip-count\" value=\"";
#line 310 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( skip_count );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t";
#line 311 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(!account_user->hasPassword()) {	responseStream << "\n";
	responseStream << "\t\t\t\t\t <div class=\"form-group\">\n";
	responseStream << "\t\t\t\t\t\t  <label for=\"sign-password\">";
#line 313 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Ich brauche nochmal dein Passwort") );
	responseStream << "</label>\n";
	responseStream << "\t\t\t\t\t\t  <input type=\"password\" class=\"form-control\" id=\"sign-password\" name=\"sign-password\" placeholder=\"";
#line 314 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Passwort") );
	responseStream << "\">\n";
	responseStream << "\t\t\t\t\t </div>\n";
	responseStream << "\t\t\t\t\t";
#line 316 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t";
#line 317 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(PAGE_USER_DATA_CORRUPTED != state && user_model->isEmailChecked()) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<button type=\"submit\" class=\"form-button\" name=\"ok\" value=\"ok\">\n";
	responseStream << "\t\t\t\t\t\t\t<i class=\"material-icons-outlined\">verified_user</i>\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 320 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion unterzeichnen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t";
#line 322 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t\t";
#line 323 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 if(transaction_removeable) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<button type=\"submit\" class=\"form-button button-cancel\" name=\"abort\" value=\"abort\">\n";
	responseStream << "\t\t\t\t\t\t\t<i class=\"material-icons-outlined\">delete</i>\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 326 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
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
  	responseStream << "\n";
	responseStream << "\t\t\t</form>\n";
	responseStream << "\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t";
#line 328 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t<button type=\"submit\" class=\"form-button button-cancel\" name=\"skip\" value=\"skip\">\n";
	responseStream << "\t\t\t\t\t\t\t<i class=\"material-icons-outlined\">debug-step-over</i>\n";
	responseStream << "\t\t\t\t\t\t\t";
#line 331 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( gettext("Transaktion &uuml;berspringen") );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t\t</button>\n";
	responseStream << "\t\t\t\t\t";
#line 333 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</form>\n";
	responseStream << "\t\t\t";
#line 335 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
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
