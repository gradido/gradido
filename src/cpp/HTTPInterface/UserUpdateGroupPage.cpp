#include "UserUpdateGroupPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 6 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"


#include "../controller/Group.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/PendingTasksManager.h"
#include "../lib/DataTypeConverter.h"
#include "../model/gradido/Transaction.h"

enum PageState {
	PAGE_STATE_OVERVIEW,
	PAGE_STATE_REQUEST_IS_RUNNING
};

#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header.cpsp"

#include "../ServerConfig.h"


UserUpdateGroupPage::UserUpdateGroupPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void UserUpdateGroupPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 20 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"

	const char* pageName = gettext("Gruppe wählen");
	auto user = mSession->getNewUser();
	auto sm = SessionManager::getInstance();
	auto pt = PendingTasksManager::getInstance();
	PageState state = PAGE_STATE_OVERVIEW;
	
	auto groups = controller::Group::listAll();
	

	if(!form.empty()) {
		auto group_id_string = form.get("group_id", "");
		if(group_id_string == "") {
			addError(new Error(gettext("Fehler"), gettext("HTML Form Fehler")));
		} else {
			int group_id = 0;
			if(DataTypeConverter::NUMBER_PARSE_OKAY == DataTypeConverter::strToInt(group_id_string, group_id)) {
				std::string group_alias = "";
				Poco::AutoPtr<controller::Group> choosen_group;
				for(auto it = groups.begin(); it != groups.end(); it++) {
					auto group_model = (*it)->getModel();
					if(group_model->getID() == group_id) {
						choosen_group = *it;
					}
				}
				if(choosen_group.isNull()) {
					addError(new Error(gettext("Fehler"), gettext("Interner Fehler")));
				} else {
					auto addGroupMemberTransaction = 
						model::gradido::Transaction::createGroupMemberUpdate(user, choosen_group);
					response.redirect(ServerConfig::g_serverPath + "/checkTransactions");
					return;
					state = PAGE_STATE_REQUEST_IS_RUNNING;
				}
			} else {
				addError(new Error(gettext("Fehler"), gettext("HTML Value Type Fehler")));
			}
		}
	} else {
		pt->lock("userUpdateGroup Page");
		if(pt->hasPendingTask(user, model::table::TASK_TYPE_GROUP_ADD_MEMBER)) {
			state = PAGE_STATE_REQUEST_IS_RUNNING;
			std::vector<Poco::AutoPtr<controller::PendingTask>> tasks = pt->getPendingTasks(user, model::table::TASK_TYPE_GROUP_ADD_MEMBER);
			// should be only one
			Poco::AutoPtr<model::gradido::Transaction> transaction = tasks[0].cast<model::gradido::Transaction>();
			if(transaction->getSignCount() == 0) {
				pt->unlock();
				response.redirect(ServerConfig::g_serverPath + "/checkTransactions");
				return;
			}
		}
		pt->unlock();
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
#line 78 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "<div class=\"content-list\">\n";
	responseStream << "\t";
#line 80 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
 if(PAGE_STATE_OVERVIEW == state ) { 	responseStream << "\n";
	responseStream << "    <div class=\"content-list-title\">\n";
	responseStream << "        <h1>";
#line 82 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Gruppe wählen") );
	responseStream << "</h1>\n";
	responseStream << "    </div>\n";
	responseStream << "\t<p>";
#line 84 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Bitte wähle die Gruppe/Gemeinschaft aus, zu der du gehörst.") );
	responseStream << "</p>\n";
	responseStream << "\t<p>";
#line 85 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Du bekommst eine Bestätigungsmail, nachdem dein Beitritt bestätigt wurde.") );
	responseStream << "</p>\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<div class=\"content-list-table\">\n";
	responseStream << "\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c1\">";
#line 89 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Auswahl") );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Name</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c2\">Alias</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c3\">Url</div>\n";
	responseStream << "\t\t\t\t<div class=\"cell header-cell c5\">";
#line 93 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Description") );
	responseStream << "</div>\n";
	responseStream << "\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 95 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
 for(auto it = groups.begin(); it != groups.end(); it++) {
					auto group_model = (*it)->getModel(); 	responseStream << "\n";
	responseStream << "\t\t\t\t<div class=\"row\">\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c1\"><input type=\"radio\" class=\"form-control\" name=\"group_id\" value=\"";
#line 98 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( group_model->getID());
	responseStream << "\" /></div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 99 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( group_model->getName() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c2\">";
#line 100 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( group_model->getAlias() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c3\">";
#line 101 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( group_model->getUrl() );
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t\t<div class=\"cell c5\">";
#line 102 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( group_model->getDescription());
	responseStream << "</div>\n";
	responseStream << "\t\t\t\t</div>\n";
	responseStream << "\t\t\t";
#line 104 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t<input class=\"grd-form-bn grd-form-bn-succeed grd_clickable\" type=\"submit\" name=\"submit\" value=\"";
#line 105 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Beitrittsanfrage senden") );
	responseStream << "\"/>\n";
	responseStream << "\t\t</div>\n";
	responseStream << "\t</form>\n";
	responseStream << "\t";
#line 108 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
 } else if(PAGE_STATE_REQUEST_IS_RUNNING == state) { 	responseStream << "\n";
	responseStream << "\t\t<p>";
#line 109 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Deine Beitrittsanfrage wird bearbeitet, du bekommst eine E-Mail wenn sie bestätigt oder abgelehnt wurde.") );
	responseStream << "</p>\n";
	responseStream << "\t\t<p><a href=\"";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( ServerConfig::g_serverPath );
	responseStream << "/logout\">";
#line 110 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
	responseStream << ( gettext("Abmelden") );
	responseStream << "</a></p>\n";
	responseStream << "\t";
#line 111 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\userUpdateGroup.cpsp"
 } 	responseStream << "\n";
	responseStream << "</div>\n";
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
