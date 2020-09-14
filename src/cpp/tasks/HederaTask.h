#ifndef __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H
#define __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H

#include "../model/hedera/TransactionResponse.h"

class HederaTask
{
public:
	inline model::hedera::TransactionResponse* getTransactionResponse() { return &mTransactionResponse; }

protected:
	model::hedera::TransactionResponse mTransactionResponse;
};

#endif //__GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H