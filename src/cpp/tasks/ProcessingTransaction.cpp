#include "ProcessingTransaction.h"
#include <sodium.h>

#include "../model/gradido/TransactionCreation.h"
#include "../model/gradido/TransactionTransfer.h"
#include "../model/gradido/GroupMemberUpdate.h"

#include "../SingletonManager/SingletonTaskObserver.h"

#include "../lib/DataTypeConverter.h"
#include "../lib/JsonRequest.h"

ProcessingTransaction::ProcessingTransaction(const std::string& proto_message_base64, DHASH userEmailHash, Languages lang, Poco::DateTime transactionCreated/* = Poco::DateTime()*/)
	:  mProtoMessageBase64(proto_message_base64), mUserEmailHash(userEmailHash),
	mLang(lang), mTransactionCreated(transactionCreated)
{
	mHashMutex.lock();
	mHash = calculateHash(proto_message_base64);
	mHashMutex.unlock();

	auto observer = SingletonTaskObserver::getInstance();
	if (userEmailHash != 0) {
		observer->addTask(userEmailHash, TASK_OBSERVER_PREPARE_TRANSACTION);
	}
}

ProcessingTransaction::~ProcessingTransaction()
{
	lock();
	auto observer = SingletonTaskObserver::getInstance();
	if (mUserEmailHash != 0) {
		observer->removeTask(mUserEmailHash, TASK_OBSERVER_PREPARE_TRANSACTION);
	}
	unlock();
}


HASH ProcessingTransaction::calculateHash(const std::string& proto_message_base64)
{
	return DRMakeStringHash(proto_message_base64.data(), proto_message_base64.size());
}

std::string ProcessingTransaction::calculateGenericHash(const std::string& protoMessageBase64)
{
	auto mm = MemoryManager::getInstance();
	auto hash = mm->getFreeMemory(crypto_generichash_BYTES);
	
	crypto_generichash(*hash, sizeof(DHASH), (const unsigned char*)protoMessageBase64.data(), protoMessageBase64.size(), NULL, 0);
	std::string base64HashString = DataTypeConverter::binToBase64(hash);
	mm->releaseMemory(hash);
	return base64HashString;
}


void ProcessingTransaction::reportErrorToCommunityServer(std::string error, std::string errorDetails, std::string created)
{
	auto transaction_hash = calculateGenericHash(mProtoMessageBase64);
	JsonRequest phpServerRequest(ServerConfig::g_php_serverHost, ServerConfig::g_phpServerPort);
	Poco::Net::NameValueCollection payload;
	
	payload.set("created", created);
	payload.set("transactionGenericHash", transaction_hash);
	payload.set("error", error);
	payload.set("errorMessage", errorDetails);

	auto ret = phpServerRequest.request("errorInTransaction", payload);
	if (ret == JSON_REQUEST_RETURN_ERROR) {
		addError(new Error("ProcessingTransaction::reportErrorToCommunityServer", "php server error"));
		getErrors(&phpServerRequest);
		sendErrorsAsEmail();
	}
}

int ProcessingTransaction::run()
{
	lock();
	
	
	auto mm = MemoryManager::getInstance();
	auto protoMessageBin = DataTypeConverter::base64ToBin(mProtoMessageBase64);
	
	auto langM = LanguageManager::getInstance();
	auto catalog = langM->getFreeCatalog(mLang);

	if (!protoMessageBin)
	{
		addError(new Error("ProcessingTransaction", "error decoding base64"));
		reportErrorToCommunityServer(catalog->gettext("decoding error"), catalog->gettext("Error decoding base64 string"), "-1");
		unlock();
		return -1;
	}
	mTransactionBody = model::gradido::TransactionBody::create(protoMessageBin);
	mm->releaseMemory(protoMessageBin);
	if (mTransactionBody.isNull()) {
		addError(new Error("ProcessingTransaction", "error creating Transaction from binary Message"));
		reportErrorToCommunityServer(catalog->gettext("decoding error"), catalog->gettext("Error by parsing to protobuf message"), "-1");
		unlock();
		return -2;
	}
	auto transaction_specific = mTransactionBody->getTransactionBase();
	if (transaction_specific) {
		if (transaction_specific->prepare()) {
			getErrors(transaction_specific);
			addError(new Error("ProcessingTransaction", "error preparing"));
			reportErrorToCommunityServer(catalog->gettext("format error"), catalog->gettext("format of specific transaction not known, wrong proto version?"), Poco::DateTimeFormatter::format(mTransactionCreated, "%s"));
			unlock();
			return -3;
		}
	}
	unlock();
	return 0;
}
