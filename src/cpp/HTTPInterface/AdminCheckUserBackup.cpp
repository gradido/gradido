#include "AdminCheckUserBackup.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"

#include "../Crypto/KeyPair.h"
#include "../SingletonManager/ConnectionManager.h"

#include "../controller/UserBackups.h"

#include "Poco/Data/Binding.h"
using namespace Poco::Data::Keywords;

typedef Poco::Tuple<int, Poco::Nullable<Poco::Data::BLOB>, std::string> UserBackupTuple;

struct SListEntry 
{
	Poco::AutoPtr<controller::User> user;
	std::vector<Poco::AutoPtr<controller::UserBackups>> backups;
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


AdminCheckUserBackup::AdminCheckUserBackup(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void AdminCheckUserBackup::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 25 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"

	const char* pageName = "Admin Check User Backups";
	auto cm = ConnectionManager::getInstance();
	KeyPair keys;
	std::list<SListEntry> notMatchingEntrys;
	
	Poco::Data::Statement select(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));
	std::list<UserBackupTuple> userBackupEntrys;
	select << "SELECT u.id, u.pubkey, b.passphrase FROM users as u LEFT JOIN user_backups as b on(u.id = b.user_id)"
	, into(userBackupEntrys);
			
	size_t resultCount = 0;
	try {
		resultCount = select.execute();
		
		for(auto it = userBackupEntrys.begin(); it != userBackupEntrys.end(); it++) {
			auto tuple = *it;
			auto pubkey = tuple.get<1>();
			if(pubkey.isNull()) {
				continue;
			}
			auto passphrase = KeyPair::filterPassphrase(tuple.get<2>());
			auto user_id = tuple.get<0>();
			Mnemonic* wordSource = nullptr;
			if(!User::validatePassphrase(passphrase, &wordSource)) {
				addError(new Error("admin Check user backup", "invalid passphrase"));
				addError(new ParamError("admin Check user backup", "passphrase", passphrase.data()));
				addError(new ParamError("admin Check user backup", "user id", user_id));
				continue;
			} else {
				keys.generateFromPassphrase(passphrase.data(), wordSource);
			}
			if(keys.isPubkeysTheSame(pubkey.value().content().data())) {
				continue;
			}
			SListEntry entry;
			entry.user = controller::User::create();
			entry.user->load(user_id);
			entry.backups = controller::UserBackups::load(user_id);
			
			notMatchingEntrys.push_back(entry);
			
		}
	}
	catch (Poco::Exception& ex) {
		addError(new ParamError("adminCheckUserBackup", "mysql error", ex.displayText().data()));
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
	responseStream << "\t<h1>Admin Check User Backup</h1>\n";
	responseStream << "\t";
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<p><b>Unmatching count: ";
#line 79 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( notMatchingEntrys.size() );
	responseStream << "</b></p>\n";
	responseStream << "\t<table>\n";
	responseStream << "\t\t<thead>\n";
	responseStream << "\t\t\t<tr><th>id</th><th>Vorname</th><th>Nachname</th><th>E-Mail</th><th>backups count</tr>\n";
	responseStream << "\t\t</thead>\n";
	responseStream << "\t\t<tbody>\n";
	responseStream << "\t\t\t";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
 for(auto it = notMatchingEntrys.begin(); it != notMatchingEntrys.end(); it++) { 
				auto userModel = (*it).user->getModel();
				responseStream << "\n";
	responseStream << "\t\t\t\t<tr>\n";
	responseStream << "\t\t\t\t<td>";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( userModel->getID() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t<td>";
#line 90 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( userModel->getFirstName() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t<td>";
#line 91 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( userModel->getLastName() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t<td>";
#line 92 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( userModel->getEmail() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t<td>";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
	responseStream << ( (*it).backups.size() );
	responseStream << "</td>\n";
	responseStream << "\t\t\t\t</tr>\n";
	responseStream << "\t\t\t";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\adminCheckUserBackup.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</tbody>\n";
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
