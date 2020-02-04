#include "ErrorManager.h"
#include "../ServerConfig.h"

#include "Poco/Net/SecureSMTPClientSession.h"
#include "Poco/Net/StringPartSource.h"

#include "../lib/ErrorList.h"

#include "../model/Email/Email.h"

#include "EmailManager.h"


ErrorManager* ErrorManager::getInstance()
{
	static ErrorManager only;
	return &only;
}

ErrorManager::ErrorManager()
	: mLogging(Poco::Logger::get("errorLog"))
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
	mWorkingMutex.lock();
	auto it = mErrorsMap.find(id);
	std::list<Error*>* list = nullptr;

	//printf("[ErrorManager::addError] error with function: %s, %s\n", error->getFunctionName(), error->getMessage());
	mLogging.error("[ErrorManager::addError] %s", error->getString());

	if (it == mErrorsMap.end()) {
		list = new std::list<Error *>;
		mErrorsMap.insert(std::pair<DHASH, std::list<Error*>*>(id, list));
	}
	else {
		list = it->second;
		// check if hash collision
		if (strcmp((*list->begin())->getFunctionName(), error->getFunctionName()) != 0) {
			mWorkingMutex.unlock();
			throw "[ErrorManager::addError] hash collision detected";
		}
	}
	list->push_back(error);

	mWorkingMutex.unlock();

}

int ErrorManager::getErrors(ErrorList* send)
{
	Error* error = nullptr;
	int iCount = 0;
	while (error = send->getLastError()) {
		addError(error);
		iCount++;
	}
	return iCount;
}

void ErrorManager::sendErrorsAsEmail()
{
	/*auto message = new Poco::Net::MailMessage();
	message->setSender("gradido_loginServer@gradido.net");
	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, "***REMOVED***"));
	message->setSubject("Error from Gradido Login Server");
	*/
	std::string content;
	mWorkingMutex.lock();
	for (auto it1 = mErrorsMap.begin(); it1 != mErrorsMap.end(); it1++) {
		auto error_list_functions = it1->second;
		content += (*error_list_functions->begin())->getFunctionName();
		content += "\n";
		for (auto it2 = error_list_functions->begin(); it2 != error_list_functions->end(); it2++) {
			content += "\t";
			size_t functionNameSize = strlen((*it2)->getFunctionName());
			content += (*it2)->getString().substr(functionNameSize+1);
			delete (*it2);
			content += "\n";
		}
		content += "\n";
		error_list_functions->clear();
	}
	mErrorsMap.clear();

	mWorkingMutex.unlock();

	auto email = new model::Email(content, model::EMAIL_ERROR);
	EmailManager::getInstance()->addEmail(email);

	//message->addContent(new Poco::Net::StringPartSource(content));
	//UniLib::controller::TaskPtr sendErrorMessageTask(new SendErrorMessage(message, ServerConfig::g_CPUScheduler));
	//sendErrorMessageTask->scheduleTask(sendErrorMessageTask);

}