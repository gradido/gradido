#include "PageRequestMessagedHandler.h"

#include "Poco/Net/HTTPServerRequest.h"

const Poco::RegularExpression PageRequestMessagedHandler::mDetectLanguageGET("^/(?:[a-zA-Z0-9_-]*)/(en|de)");

Languages PageRequestMessagedHandler::chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string post_lang /* =  std::string("") */)
{

	// from Form
	Languages lang = LanguageManager::languageFromString(post_lang);
	if (lang == LANG_NULL) {
		// from URL
		std::string uri = request.getURI();
		std::string lang_str;
		mDetectLanguageGET.extract(uri, lang_str);
		if (lang_str.size() > 0) {
			lang = LanguageManager::languageFromString(lang_str);
		}
		else {
			// from Header
			/*
			$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
			$acceptLang = ['fr', 'it', 'en'];
			$lang = in_array($lang, $acceptLang) ? $lang : 'en';
			*/
			std::string accept_languages = request.get("HTTP_ACCEPT_LANGUAGE", "");
			printf("accept header: %s\n", accept_languages.data());
		}
	}

	return lang;
}