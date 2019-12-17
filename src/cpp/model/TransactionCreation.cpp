#include "TransactionCreation.h"
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

