#include "SigningTransaction.h"

#include "../SingletonManager/ErrorManager.h"

SigningTransaction::SigningTransaction(Poco::AutoPtr<ProcessingTransaction> processingeTransaction, Poco::AutoPtr<User> user)
	: mProcessingeTransaction(processingeTransaction), mUser(user)
{

}

SigningTransaction::~SigningTransaction()
{

}

int SigningTransaction::run() {
	auto em = ErrorManager::getInstance();


	Error* transactionError = new Error("SigningTransaction start", mProcessingeTransaction->mTransactionBody.SerializeAsString().data());
	
	//= new Error("SigningTransaction start", mProcessingeTransaction->g)
	if (mUser.isNull() || !mUser->hasCryptoKey()) {
		em->addError(new Error("SigningTransaction", "user hasn't crypto key or is null"));
		em->sendErrorsAsEmail();
		return -1;
	}

	auto privKey = mUser->getPrivKey();
	if (!privKey) {
		em->getErrors(mUser);
		em->addError(new Error("SigningTransaction", "couldn't get user priv key"));
		em->sendErrorsAsEmail();
		return -2;
	}

	delete privKey;

	return 0;
}