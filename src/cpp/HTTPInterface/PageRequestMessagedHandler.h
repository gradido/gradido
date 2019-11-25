#ifndef PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
#define PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED

#include "../model/Session.h"
#include "../lib/ErrorList.h"
#include "../lib/Profiler.h"

#include "../SingletonManager/LanguageManager.h"

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/RegularExpression.h"

class PageRequestMessagedHandler : public Poco::Net::HTTPRequestHandler, public ErrorList
{
public:
	PageRequestMessagedHandler() {}

	inline void setProfiler(Profiler profiler) { mTimeProfiler = profiler; }
	//Poco::Net::HTTPRequestHandler* createRequestHandler(const Poco::Net::HTTPServerRequest& request);

protected:
	static const Poco::RegularExpression mDetectLanguageGET;

	inline const char* gettext(Session* session, const char* text) { if (!session || !session->getLanguageCatalog()) return text; return session->getLanguageCatalog()->gettext(text); }
	Languages chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string lang_btn = "");

	unsigned long long getLastGetAsU64(const std::string& uri);

	Profiler mTimeProfiler;
	
};


#endif // PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
