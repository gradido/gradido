#include "TransactionCreation.h"
#include "Poco/DateTimeFormatter.h"
#include <sodium.h>

TransactionCreation::TransactionCreation(const std::string& memo, const proto::gradido::GradidoCreation& protoCreation)
	: TransactionBase(memo), mProtoCreation(protoCreation)
{
	memset(mReceiverPublicHex, 0, 65);
}

TransactionCreation::~TransactionCreation()
{
	
}

int TransactionCreation::prepare()
{
	const static char functionName[] = { "TransactionCreation::prepare" };
	if (!mProtoCreation.has_receiver()) {
		addError(new Error(functionName, "hasn't receiver amount"));
		return -1;
	}
	auto receiver_amount = mProtoCreation.receiver();

	auto receiverPublic = receiver_amount.pubkey();
	if (receiverPublic.size() != 32) {
		addError(new Error(functionName, "receiver public invalid (size not 32)"));
		return -2;
	}
	mReceiverUser = controller::User::create();
	//mReceiverUser = new User((const unsigned char*)receiverPublic.data());
	mReceiverUser->load((const unsigned char*)receiverPublic.data());
	getErrors(mReceiverUser->getModel());
	if (mReceiverUser->getUserState() == USER_EMPTY) {
		sodium_bin2hex(mReceiverPublicHex, 65, (const unsigned char*)receiverPublic.data(), receiverPublic.size());
                mReceiverUser.assign(nullptr);
	}
	else {
		memcpy(mReceiverPublicHex, mReceiverUser->getModel()->getPublicKeyHex().data(), 64);
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

