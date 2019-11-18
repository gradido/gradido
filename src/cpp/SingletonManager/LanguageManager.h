/*!
*
* \author: einhornimmond
*
* \date: 13.11.19
*
* \brief: manage language translations with help of spirit_po
*/

#ifndef GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_LANGUAGE_MANAGER_H
#define GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_LANGUAGE_MANAGER_H

#include "Poco/AutoPtr.h"
#include "Poco/Logger.h"

#include "../lib/MultithreadContainer.h"
//#include <spirit_po/spirit_po.hpp>
#include <list>


enum Languages {
	LANG_DE,
	LANG_EN,
	LANG_COUNT,
	LANG_NULL
};

//spirit_po::default_catalog
namespace spirit_po {
	//class default_catalog;
	//using default_catalog = catalog<>;
	typedef unsigned int uint;

}

class LanguageCatalog : protected UniLib::lib::MultithreadContainer
{

public:
	LanguageCatalog(Languages lang);
	~LanguageCatalog();

	// for poco auto ptr
	void duplicate();
	void release();

	// catalog overload api

	const char * gettext(const char * msgid);
	const char * ngettext(const char * msgid, const char * msgid_plural, spirit_po::uint plural);
	const char * pgettext(const char * msgctxt, const char * msgid);
	const char * npgettext(const char * msgctxt, const char * msgid, const char * msgid_plural, spirit_po::uint plural);

	std::string gettext_str(const std::string & msgid);
	std::string ngettext_str(const std::string & msgid, const std::string & msgid_plural, spirit_po::uint plural);
	std::string pgettext_str(const std::string & msgctxt, const std::string & msgid);
	std::string npgettext_str(const std::string & msgctxt, const std::string & msgid, const std::string & msgid_plural, spirit_po::uint plural);

	inline Languages getLanguage() { return mThisLanguage; }

protected:
	int mReferenceCount;
	void* mCatalog;
	Languages mThisLanguage;
};


class LanguageManager : protected UniLib::lib::MultithreadContainer
{
	friend class LanguageCatalog;
public:
	~LanguageManager();

	static LanguageManager* getInstance();

	Poco::AutoPtr<LanguageCatalog> getFreeCatalog(Languages lang);
	
	static std::string filenameForLanguage(Languages lang);
	// return empty for null
	static std::string keyForLanguage(Languages lang);
	static Languages languageFromString(const std::string& language_key);

protected:
	LanguageManager();

	void returnCatalog(LanguageCatalog* catalog);

	std::list<LanguageCatalog*> mFreeCatalogs[LANG_COUNT];

	// poco logging
	Poco::Logger& mLogging;

};



#endif //GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_LANGUAGE_MANAGER_H