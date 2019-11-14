#include "LanguageManager.h"

LanguageCatalog::LanguageCatalog(Languages lang) 
	: mReferenceCount(1), mCatalog(nullptr), mThisLanguage(lang) 
{
	// TODO: Catalog init code
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

Poco::AutoPtr<LanguageCatalog> LanguageManager::getFreeCatalog(Languages lang)
{
	
	if (lang >= LANG_COUNT) {
		//printf("[LanguageManager::getFreeCatalog] invalid language: %d\n", lang);
		mLogging.error("[LanguageManager::getFreeCatalog] invalid language: %d", lang);
		return nullptr;
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