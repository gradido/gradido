#ifndef SESSION_HTTP_REQUEST_HANDLER_INCLUDED
#define SESSION_HTTP_REQUEST_HANDLER_INCLUDED

#include "../model/Session.h"
#include "PageRequestMessagedHandler.h"



class SessionHTTPRequestHandler : public PageRequestMessagedHandler
{
public:
	SessionHTTPRequestHandler(Session* session) : mSession(session) {}
	
protected:
	Session* mSession;

	Languages chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string lang_btn = "");
	inline const char* gettext(const char* text) { if (!mSession || !mSession->getLanguageCatalog()) return text; return mSession->getLanguageCatalog()->gettext(text); }
	
};


#endif // SESSION_HTTP_REQUEST_HANDLER_INCLUDED
