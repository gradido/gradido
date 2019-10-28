#include "ProcessingTransaction.h"
#include <sodium.h>

#include "../model/TransactionCreation.h"
#include "../model/TransactionTransfer.h"

ProcessingTransaction::ProcessingTransaction(const std::string& proto_message_base64)
	: mType(TRANSACTION_NONE), mProtoMessageBase64(proto_message_base64), mTransactionSpecific(nullptr)
{
	mHashMutex.lock();
	mHash = calculateHash(proto_message_base64);
	mHashMutex.unlock();
}

ProcessingTransaction::~ProcessingTransaction()
{
	lock();
	if (mTransactionSpecific) {
		delete mTransactionSpecific;
		mTransactionSpecific = nullptr;
	}
	unlock();
}


HASH ProcessingTransaction::calculateHash(const std::string& proto_message_base64)
{
	return DRMakeStringHash(proto_message_base64.data(), proto_message_base64.size());
}

int ProcessingTransaction::run()
{
	lock();
	//mTransactionBody.ParseFromString();
	unsigned char* binBuffer = (unsigned char*)malloc(mProtoMessageBase64.size());
	size_t resultingBinSize = 0;
	size_t base64_size = mProtoMessageBase64.size();
	if (sodium_base642bin(
		binBuffer, base64_size,
		mProtoMessageBase64.data(), base64_size, 
		nullptr, &resultingBinSize, nullptr, 
		sodium_base64_VARIANT_ORIGINAL)) 
	{
		free(binBuffer);
		addError(new Error("ProcessingTransaction", "error decoding base64"));
		unlock();
		return -1;
	}
	std::string binString((char*)binBuffer, resultingBinSize);
	free(binBuffer);
	if (!mTransactionBody.ParseFromString(binString)) {
		addError(new Error("ProcessingTransaction", "error creating Transaction from binary Message"));
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

TransactionCreation* ProcessingTransaction::getCreationTransaction()
{
	return dynamic_cast<TransactionCreation*>(mTransactionSpecific);
}

TransactionTransfer* ProcessingTransaction::getTransferTransaction()
{
	return dynamic_cast<TransactionTransfer*>(mTransactionSpecific);
}