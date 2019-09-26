#include "ErrorManager.h"

ErrorManager* ErrorManager::getInstance()
{
	static ErrorManager only;
	return &only;
}

ErrorManager::ErrorManager()
{

}

ErrorManager::~ErrorManager()
{
	for (auto it = mErrorsMap.begin(); it != mErrorsMap.end(); it++) {
		for (auto listIt = it->second->begin(); listIt != it->second->end(); listIt++) {
			delete *listIt;
		}
		delete it->second;
	}
	mErrorsMap.clear();
}

void ErrorManager::addError(Error* error)
{
	DHASH id = DRMakeStringHash(error->getFunctionName());
	auto it = mErrorsMap.find(id);
	std::list<Error*>* list = nullptr;

	printf("[ErrorManager::addError] error with function: %s, %s\n", error->getFunctionName(), error->getMessage());

	if (it == mErrorsMap.end()) {
		list = new std::list<Error *>;
	}
	else {
		list = it->second;
		// check if hash collision
		if (strcmp((*list->begin())->getFunctionName(), error->getFunctionName()) != 0) {
			throw "[ErrorManager::addError] hash collision detected";
		}
	}
	list->push_back(error);


}