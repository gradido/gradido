#include "ProcessingTransaction.h"
#include <sodium.h>

#include "../model/TransactionCreation.h"
#include "../model/TransactionTransfer.h"

#include "../SingletonManager/SingletonTaskObserver.h"

#include "../lib/DataTypeConverter.h"
#include "../lib/JsonRequest.h"

ProcessingTransaction::ProcessingTransaction(const std::string& proto_message_base64, DHASH userEmailHash, Languages lang)
	: mType(TRANSACTION_NONE), mProtoMessageBase64(proto_message_base64), mTransactionSpecific(nullptr), mUserEmailHash(userEmailHash),
	mLang(lang)
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
	if (mTransactionSpecific) {
		delete mTransactionSpecific;
		mTransactionSpecific = nullptr;
	}
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
	//mTransactionBody.ParseFromString();
	unsigned char* binBuffer = (unsigned char*)malloc(mProtoMessageBase64.size());
	size_t resultingBinSize = 0;
	size_t base64_size = mProtoMessageBase64.size();
	auto langM = LanguageManager::getInstance();
	auto catalog = langM->getFreeCatalog(mLang);

	if (sodium_base642bin(
		binBuffer, base64_size,
		mProtoMessageBase64.data(), base64_size, 
		nullptr, &resultingBinSize, nullptr, 
		sodium_base64_VARIANT_ORIGINAL)) 
	{
		free(binBuffer);
		addError(new Error("ProcessingTransaction", "error decoding base64"));
		reportErrorToCommunityServer(catalog->gettext("decoding error"), catalog->gettext("Error decoding base64 string"), "-1");
		unlock();
		return -1;
	}
	std::string binString((char*)binBuffer, resultingBinSize);
	free(binBuffer);
	if (!mTransactionBody.ParseFromString(binString)) {
		addError(new Error("ProcessingTransaction", "error creating Transaction from binary Message"));
		reportErrorToCommunityServer(catalog->gettext("decoding error"), catalog->gettext("Error by parsing to protobuf message"), "-1");
		unlock();
		return -2;
	}

	// check Type
	if (mTransactionBody.has_creation()) {
		mType = TRANSACTION_CREATION;
		mTransactionSpecific = new TransactionCreation(mTransactionBody.memo(), mTransactionBody.creation());
	}
	else if (mTransactionBody.has_transfer()) {
		mType = TRANSACTION_TRANSFER;
		mTransactionSpecific = new TransactionTransfer(mTransactionBody.memo(), mTransactionBody.transfer());
	}
	if (mTransactionSpecific) {
		if (mTransactionSpecific->prepare()) {
			getErrors(mTransactionSpecific);
			addError(new Error("ProcessingTransaction", "error preparing"));
			reportErrorToCommunityServer(catalog->gettext("format error"), catalog->gettext("format of specific transaction not known, wrong proto version?"), std::to_string(mTransactionBody.created().seconds()));
			unlock();
			return -3;
		}
	}
	unlock();
	return 0;
}

std::string ProcessingTransaction::getMemo()
{
	lock();
	if (mTransactionBody.IsInitialized()) {
		std::string result(mTransactionBody.memo());
		unlock();
		return result;
	}
	unlock();
	return "<uninitalized>";
}

std::string ProcessingTransaction::getBodyBytes()
{
	lock();
	if (mTransactionBody.IsInitialized()) {
		auto size = mTransactionBody.ByteSize();
		//auto bodyBytesSize = MemoryManager::getInstance()->getFreeMemory(mProtoCreation.ByteSizeLong());
		std::string resultString(size, 0);
		if (!mTransactionBody.SerializeToString(&resultString)) {
			addError(new Error("TransactionCreation::getBodyBytes", "error serializing string"));
			unlock();
			return "";
		}
		unlock();
		return resultString;
	}
	unlock();
	return "<uninitalized>";
}

TransactionCreation* ProcessingTransaction::getCreationTransaction()
{
	return dynamic_cast<TransactionCreation*>(mTransactionSpecific);
}

TransactionTransfer* ProcessingTransaction::getTransferTransaction()
{
	return dynamic_cast<TransactionTransfer*>(mTransactionSpecific);
}