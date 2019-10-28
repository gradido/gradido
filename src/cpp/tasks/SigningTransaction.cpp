#include "SigningTransaction.h"

SigningTransaction::SigningTransaction(Poco::AutoPtr<ProcessingTransaction> transactionBody)
	: mTransactionBody(transactionBody)
{

}

SigningTransaction::~SigningTransaction()
{

}

int SigningTransaction::run() {
	return 0;
}