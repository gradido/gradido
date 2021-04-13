#include "PageRequestMessagedHandler.h"

#include "Poco/Net/HTTPServerRequest.h"

#include "../ServerConfig.h"

//const Poco::RegularExpression PageRequestMessagedHandler::mDetectLanguageGET("^(?:/[a-zA-Z0-9_-]*)?/(en|de)");
// detect also lang field from form get
const Poco::RegularExpression PageRequestMessagedHandler::mDetectLanguageGET("^(?:/[a-zA-Z0-9/_-]*)?(?:/(en|de)|\\?.*lang=(en|de))");

PageRequestMessagedHandler::PageRequestMessagedHandler()
	: mLoginServerPath("/account")
{

}

Languages PageRequestMessagedHandler::chooseLanguage(Poco::Net::HTTPServerRequest& request, std::string lang_btn /*= ""*/)
{

	// from Form
	Languages lang = LanguageManager::languageFromString(lang_btn);
	if (lang == LANG_NULL) {
		// from URL
		std::string uri = request.getURI();
		std::vector<std::string> matches;
		//std::string lang_str;
		mDetectLanguageGET.split(uri, matches);
		if (matches.size() > 0) {
			//for (auto it = matches.begin(); it != matches.end(); it++) {
//				printf("Matches: %s\n", it->data());
			//}
			lang = LanguageManager::languageFromString(matches[matches.size()-1]);
		}
		else {
			// from Header
			/*
			$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
			$acceptLang = ['fr', 'it', 'en'];
			$lang = in_array($lang, $acceptLang) ? $lang : 'en';
			*/
			std::string accept_languages = request.get("HTTP_ACCEPT_LANGUAGE", "");
			//printf("[PageRequestMessagedHandler::chooseLanguage] accept header: %s\n", accept_languages.data());
		}
	}

	if (lang == LANG_NULL) {
		//lang = ServerConfig::g_default_locale;
	}

	return lang;
}

unsigned long long PageRequestMessagedHandler::getLastGetAsU64(const std::string& uri)
{
	unsigned long long result = 0;
	size_t pos = uri.find_last_of("/");
	try {
		auto str = uri.substr(pos + 1);
		result = stoull(uri.substr(pos + 1));
	}
	catch (const std::invalid_argument& ia) {
		std::cerr << __FUNCTION__ << " Invalid argument: " << ia.what() << ", str: " << uri.substr(pos + 1) << '\n';
		return 0;
	}
	catch (const std::out_of_range& oor) {
		std::cerr << __FUNCTION__ << " Out of Range error: " << oor.what() << '\n';
		return 0;
	}
	catch (const std::logic_error & ler) {
		std::cerr << __FUNCTION__ << " Logical error: " << ler.what() << '\n';
		return 0;
	}
	catch (...) {
		std::cerr << __FUNCTION__ << " Unknown error" << '\n';
		return 0;
	}
	return result;
}

std::string PageRequestMessagedHandler::getBaseUrl() 
{
	if (ServerConfig::g_ServerSetupType == ServerConfig::SERVER_TYPE_TEST) {
		return "http://" + mHost + mLoginServerPath;
	}
	return "https://" + mHost + mLoginServerPath; 
}