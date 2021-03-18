#include "SessionHTTPRequestHandler.h"


Languages SessionHTTPRequestHandler::chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string lang_btn /*= ""*/)
{
	Languages lang = LANG_NULL;
	if (mSession) {
		lang = mSession->getLanguage();
	}
	Languages langCurrent = PageRequestMessagedHandler::chooseLanguage(request, lang_btn);
	if (langCurrent != LANG_NULL && lang != langCurrent) {
	 lang = langCurrent;
		if (mSession) {
			mSession->setLanguage(langCurrent);
		}
	}
	

	return lang;
}






