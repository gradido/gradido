#include "TransactionCreation.h"
#include <sodium.h>

TransactionCreation::TransactionCreation(const model::messages::gradido::TransactionCreation& protoCreation)
	: mProtoCreation(protoCreation), mReceiverUser(nullptr)
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
	mReceiverUser = new User(receiverPublic.data());
	getErrors(mReceiverUser);
	if (mReceiverUser->getUserState() == USER_EMPTY) {
		sodium_bin2hex(mReceiverPublicHex, 64, (const unsigned char*)receiverPublic.data(), receiverPublic.size());
		delete mReceiverUser;
		mReceiverUser = nullptr;
	}
	else {
		memcpy(mReceiverPublicHex, mReceiverUser->getPublicKeyHex().data(), 64);
		if (!mReceiverUser->validateIdentHash(mProtoCreation.ident_hash())) {
			addError(new Error(functionName, "ident hash isn't the same"));
			return -3;
		}
	}
	//

	
	return 0;
}