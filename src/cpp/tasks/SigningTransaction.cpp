#include "SigningTransaction.h"

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/MemoryManager.h"

SigningTransaction::SigningTransaction(Poco::AutoPtr<ProcessingTransaction> processingeTransaction, Poco::AutoPtr<User> user)
	: mProcessingeTransaction(processingeTransaction), mUser(user)
{

}

SigningTransaction::~SigningTransaction()
{

}

int SigningTransaction::run() {
	auto em = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();

	Error* transactionError = new Error("SigningTransaction start", mProcessingeTransaction->mProtoMessageBase64.data());

	
	//= new Error("SigningTransaction start", mProcessingeTransaction->g)
	if (mUser.isNull() || !mUser->hasCryptoKey()) {
		em->addError(transactionError);
		em->addError(new Error("SigningTransaction", "user hasn't crypto key or is null"));
		em->sendErrorsAsEmail();
		return -1;
	}

	//auto privKey = mUser->getPrivKey();
	if (!mUser->hasPrivKey()) {
		em->addError(transactionError);
		em->getErrors(mUser);
		em->addError(new Error("SigningTransaction", "couldn't get user priv key"));
		em->sendErrorsAsEmail();
		return -2;
	}

	//auto sign = mUser->sign(mProcessingeTransaction->)
	delete transactionError;
	//delete privKey;
	//mm->releaseMemory(privKey);

	return 0;
}