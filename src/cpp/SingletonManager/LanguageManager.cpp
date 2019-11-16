#include "LanguageManager.h"

#include "Poco/Path.h"
#include "Poco/File.h"

#include <fstream>

LanguageCatalog::LanguageCatalog(Languages lang) 
	: mReferenceCount(1), mCatalog(nullptr), mThisLanguage(lang) 
{
	// TODO: Catalog init code
	std::string path = Poco::Path::config() + "grd_login/LOCALE/" + LanguageManager::filenameForLanguage(lang) + ".po";
	auto file = Poco::File(path);
	if (file.exists()) {

		std::ifstream ifs(path + LanguageManager::filenameForLanguage(lang) + ".po");
		std::string po_file{ std::istreambuf_iterator<char>{ifs}, std::istreambuf_iterator<char>() };

		mCatalog = new spirit_po::default_catalog(spirit_po::default_catalog::from_range(po_file));
	}
	//spirit_po::default_catalog cat{ spirit_po::default_catalog::from_range(po_file) };
}

LanguageCatalog::~LanguageCatalog()
{
	if (mCatalog) {
		delete mCatalog;
		mCatalog = nullptr;
	}
}

void LanguageCatalog::release()
{
	lock();
	mReferenceCount--;
	bool canReturnPointer = false;
	if (mReferenceCount <= 0) {
		canReturnPointer = true;
	}
	unlock();

	if (canReturnPointer) {
		//return pointer
		LanguageManager::getInstance()->returnCatalog(this);
	}
}


// ******************************************************

LanguageManager* LanguageManager::getInstance()
{
	static LanguageManager only;
	return &only;
}

LanguageManager::LanguageManager()
	: mLogging(Poco::Logger::get("errorLog"))
{

}

LanguageManager::~LanguageManager()
{
	lock();
	for (int lang = 0; lang < LANG_COUNT; lang++) {
		for (auto it = mFreeCatalogs[lang].begin(); it != mFreeCatalogs[lang].end(); it++) {
			delete *it;
		}
		mFreeCatalogs[lang].clear();
	}
	unlock();
}

void LanguageManager::returnCatalog(LanguageCatalog* catalog)
{
	if (!catalog) return;
	if (catalog->getLanguage() >= LANG_COUNT) {
		//printf("[LanguageManager::returnCatalog] invalid language: %d\n", catalog->getLanguage());
		mLogging.error("[LanguageManager::returnCatalog] invalid language: %d", catalog->getLanguage());
		delete catalog;
		return;
	}
	lock();
	mFreeCatalogs[catalog->getLanguage()].push_back(catalog);
	unlock();
}

std::string LanguageManager::filenameForLanguage(Languages lang)
{
	switch (lang) {
	case LANG_DE: return "de_DE";
	case LANG_EN: return "en_GB";
	}
	return "en_GB";
}

Languages LanguageManager::languageFromString(const std::string& language_key)
{
	if (language_key == "de") {
		return LANG_DE;
	}
	if (language_key == "en") {
		return LANG_EN;
	}
	return LANG_NULL;
}

Poco::AutoPtr<LanguageCatalog> LanguageManager::getFreeCatalog(Languages lang)
{
	
	if (lang >= LANG_COUNT) {
		//printf("[LanguageManager::getFreeCatalog] invalid language: %d\n", lang);
		mLogging.information("[LanguageManager::getFreeCatalog] invalid language: %d, set to default (en_GB)", (int)lang);
		//return nullptr;
		lang = LANG_EN;
	}
	lock();
	if (mFreeCatalogs[lang].size() > 0) {
		auto result = mFreeCatalogs[lang].back();
		result->duplicate();
		mFreeCatalogs[lang].pop_back();
		unlock();
		return result;
	}
	Poco::AutoPtr<LanguageCatalog> result = new LanguageCatalog(lang);
	return result;
}