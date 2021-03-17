#include "TransactionCreation.h"
#include "Poco/DateTimeFormatter.h"
#include <sodium.h>

TransactionCreation::TransactionCreation(const std::string& memo, const model::messages::gradido::TransactionCreation& protoCreation)
	: TransactionBase(memo), mProtoCreation(protoCreation), mReceiverUser(nullptr)
{
	memset(mReceiverPublicHex, 0, 65);
}

TransactionCreation::~TransactionCreation()
{
	if (mReceiverUser) {
		delete mReceiverUser;
		mReceiverUser = nullptr;
	}
}

int TransactionCreation::prepare()
{
	const static char functionName[] = { "TransactionCreation::prepare" };
	if (!mProtoCreation.has_receiveramount()) {
		addError(new Error(functionName, "hasn't receiver amount"));
		return -1;
	}
	auto receiverAmount = mProtoCreation.receiveramount();

	if (receiverAmount.amount() <= 0) {
		addError(new Error(functionName, "amount must be > 0"));
		return -4;
	}
	if (receiverAmount.amount() > 10000000) {
		addError(new Error(functionName, "amount must be <= 1000 GDD"));
		return -5;
	}

	auto receiverPublic = receiverAmount.ed25519_receiver_pubkey();
	if (receiverPublic.size() != 32) {
		addError(new Error(functionName, "receiver public invalid (size not 32)"));
		return -2;
	}
	mReceiverUser = new User((const unsigned char*)receiverPublic.data());
	getErrors(mReceiverUser);
	if (mReceiverUser->getUserState() == USER_EMPTY) {
		sodium_bin2hex(mReceiverPublicHex, 65, (const unsigned char*)receiverPublic.data(), receiverPublic.size());
		delete mReceiverUser;
		mReceiverUser = nullptr;
	}
	else {
		memcpy(mReceiverPublicHex, mReceiverUser->getPublicKeyHex().data(), 64);
		// uncomment because not correctly working
		/*if (!mReceiverUser->validateIdentHash(mProtoCreation.ident_hash())) {
			addError(new Error(functionName, "ident hash isn't the same"));
			addError(new ParamError(functionName, "hash calculated from email: ", mReceiverUser->getEmail()));
			addError(new ParamError(functionName, "hash: ", std::to_string(mProtoCreation.ident_hash())));
			return -3;
		}*/
	}
	//

	
	return 0;
}

std::string TransactionCreation::getTargetDateString()
{
	// proto format is seconds, poco timestamp format is microseconds
	Poco::Timestamp pocoStamp(mProtoCreation.target_date().seconds() * 1000*1000);
	//Poco::DateTime(pocoStamp);
	return Poco::DateTimeFormatter::format(pocoStamp, "%d. %b %y");
}

