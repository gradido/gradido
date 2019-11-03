#include "CheckTransactionPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"

#include "../SingletonManager/SessionManager.h"
#include "../model/TransactionCreation.h"
#include "../model/TransactionTransfer.h"

enum PageState {
	PAGE_TRANSACTION_CREATION,
	PAGE_TRANSACTION_TRANSFER,
	PAGE_NO_TRANSACTIONS
};

#line 1 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
 
#include "../ServerConfig.h"	


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
#line 19 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 
	const char* pageName = "&Uuml;berpr&uuml;fe Transaktion";
	auto accountUser = mSession->getUser();
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
					addError(new Error("Passwort", "Das Passwort stimmt nicht. Bitte verwende dein Passwort von der Registrierung"));
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
		response.redirect(ServerConfig::g_php_serverPath);
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
	// begin include header.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
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
	responseStream << "\t<p class=\"grd_small\">Alpha 0.4.5</p>\n";
	responseStream << "</div>\n";
	responseStream << "<!--<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 58 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\header.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  <li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>-->";
	// end include header.cpsp
	// begin include navi.cpsp
	responseStream << "<nav class=\"grd-left-bar expanded\" data-topbar role=\"navigation\">\n";
	responseStream << "\t<div class=\"grd-left-bar-section\">\n";
	responseStream << "\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t  <li><a href=\"";
#line 4 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\navi.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "\" class=\"grd-nav-bn\">Startseite</a>\n";
	responseStream << "\t\t  ";
#line 5 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\navi.cpsp"
 if(enableLogout) { 	responseStream << "\n";
	responseStream << "\t\t\t<li><a href=\"./account/logout\" class=\"grd-nav-bn\">Logout</a></li>\n";
	responseStream << "\t\t  ";
#line 7 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\navi.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</ul>\n";
	responseStream << "\t</div>\n";
	responseStream << "</nav>";
	// end include navi.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Eine Transaktion pr&uuml;fen</h1>\n";
	responseStream << "\t";
#line 68 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t";
#line 69 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions > 0 && sumTransactions - notReadyTransactions != 1) { 	responseStream << "\n";
	responseStream << "\t\t";
#line 70 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(notReadyTransactions > 0) { 	responseStream << " \n";
	responseStream << "\t\t\t<pre>";
#line 71 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions - notReadyTransactions );
	responseStream << " von ";
#line 71 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " Transaktionen sind bereit zum pr&uuml;fen</pre>\n";
	responseStream << "\t\t";
#line 72 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t<pre>";
#line 73 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( sumTransactions );
	responseStream << " Transaktionen warten darauf &uuml;berpr&uuml;ft zu werden.</pre>\n";
	responseStream << "\t\t";
#line 74 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 75 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t";
#line 76 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(state == PAGE_NO_TRANSACTIONS) { 	responseStream << "\n";
	responseStream << "\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t";
#line 78 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(sumTransactions == 0) { 	responseStream << "\n";
	responseStream << "\t\t\t<div class=\"grd_text\">Es gibt zurzeit keine Transaktionen zum &uuml;berpr&uuml;fen</div>\n";
	responseStream << "\t\t";
#line 80 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t<div class=\"grd_text\">Transaktion(en) werden noch vorbereitet, bitte lade die Seite in wenigen Augenblicken erneut.</div>\n";
	responseStream << "\t\t";
#line 82 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "\t\n";
	responseStream << "\t";
#line 85 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } else if(state == PAGE_TRANSACTION_CREATION) { 
		auto creationTransaction = processingTransaction->getCreationTransaction();
		auto transactionUser = creationTransaction->getUser();
		
		responseStream << "\n";
	responseStream << "\t<div class=\"grd_text-max-width\">\n";
	responseStream << "\t\t<h2>Sch&ouml;pfungstransaktion</h2>\n";
	responseStream << "\t\t<b>Memo: </b>\n";
	responseStream << "\t\t<p>";
#line 93 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getMemo() );
	responseStream << "</p>\n";
	responseStream << "\t\t<b>Empf&auml;nger: </b>\n";
	responseStream << "\t\t";
#line 95 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(transactionUser) { 	responseStream << "\n";
	responseStream << "\t\t\t<p class=\"grd_small\">";
#line 96 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getFirstName() );
	responseStream << " ";
#line 96 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getLastName() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">";
#line 97 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( transactionUser->getEmail() );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 98 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } else { 	responseStream << "\n";
	responseStream << "\t\t\t<p class=\"grd_small\">";
#line 99 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getPublicHex() );
	responseStream << "</p>\n";
	responseStream << "\t\t";
#line 100 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t<b>Summe: </b>\n";
	responseStream << "\t\t";
#line 102 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( creationTransaction->getAmountString() );
	responseStream << "&nbsp;Gradido\n";
	responseStream << "\t\t<form >\n";
	responseStream << "\t\t\tUnterschreiben mit aktuellem Account?<br>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">";
#line 105 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getFirstName() );
	responseStream << " ";
#line 105 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getLastName() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">";
#line 106 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
	responseStream << ( accountUser->getEmail() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 107 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 // TODO: additional password check 	responseStream << "\n";
	responseStream << "\t\t\t";
#line 108 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 if(!accountUser->hasCryptoKey()) {	responseStream << "\n";
	responseStream << "\t\t\t<p>Ich brauche nochmal dein Passwort</p>\n";
	responseStream << "\t\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t\t<label for=\"sign-password\">Passwort</label>\n";
	responseStream << "\t\t\t\t\t<input id=\"sign-password\" type=\"password\" name=\"sign-password\"/>\n";
	responseStream << "\t\t\t\t</p>\n";
	responseStream << "\t\t\t";
#line 114 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"ok\" value=\"Transaktion unterzeichnen\">\n";
	responseStream << "\t\t\t<input class=\"grd-form-bn grd-form-bn-discard grd_clickable\" type=\"submit\" name=\"abort\" value=\"Transaktion verwerfen\">\n";
	responseStream << "\t\t</form>\n";
	responseStream << "\t</div>\t\n";
	responseStream << "\t";
#line 119 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\checkTransaction.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "\t<div class=\"grd-time-used dev-info\">\n";
	responseStream << "\t\t\t";
#line 2 "I:\\Code\\C++\\Eigene_Projekte\\Gradido_LoginServer\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	// end include footer.cpsp
	if (_compressResponse) _gzipStream.close();
}
