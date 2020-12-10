#ifndef PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
#define PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED

#include "../model/Session.h"
#include "../lib/NotificationList.h"
#include "../lib/Profiler.h"

#include "../SingletonManager/LanguageManager.h"

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/RegularExpression.h"

class PageRequestMessagedHandler : public Poco::Net::HTTPRequestHandler, public NotificationList
{
public:
	PageRequestMessagedHandler();

	inline void setProfiler(Profiler profiler) { mTimeProfiler = profiler; }
	inline void setHost(std::string host) { mHost = host; }
	//Poco::Net::HTTPRequestHandler* createRequestHandler(const Poco::Net::HTTPServerRequest& request);

protected:
	static const Poco::RegularExpression mDetectLanguageGET;

	inline const char* gettext(Session* session, const char* text) { if (!session || !session->getLanguageCatalog()) return text; return session->getLanguageCatalog()->gettext(text); }
	virtual Languages chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string lang_btn = "");

	unsigned long long getLastGetAsU64(const std::string& uri);
	inline std::string getBaseUrl() { return "https://" + mHost; }

	Profiler mTimeProfiler;
	std::string mHost;
	
};


#endif // PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
