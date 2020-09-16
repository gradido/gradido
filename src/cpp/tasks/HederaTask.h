#ifndef __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H
#define __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H

#include "../model/hedera/TransactionResponse.h"
#include "../model/hedera/TransactionReceipt.h"
#include "../proto/hedera/BasicTypes.pb.h"
#include "../proto/hedera/Duration.pb.h"

#include "Poco/Timestamp.h"

#include <shared_mutex>

class HederaTask
{
public:

	HederaTask();
	~HederaTask();

	inline model::hedera::TransactionResponse* getTransactionResponse() { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return &mTransactionResponse; }
	inline void setTransactionId(const proto::TransactionID& transactionId) { std::unique_lock<std::shared_mutex> _lock(mWorkingMutex); mTransactionID = transactionId; }
	inline void setValidDuration(const proto::Duration& validDuration) { std::unique_lock<std::shared_mutex> _lock(mWorkingMutex); mValidDuration = validDuration; }
	//! \param transactionReceipt take ownership and call delete if done
	void setTransactionReceipt(model::hedera::TransactionReceipt* transactionReceipt);

	inline const proto::TransactionID& getTransactionId() const { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mTransactionID; }
	inline const proto::Duration& getDuration() const { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mValidDuration; }
	inline const model::hedera::TransactionReceipt* getTransactionReceipt() const{ std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mTransactionReceipt; }

	//! \ brief return true if transactionValidStart + validDuration > now
	bool isTimeout();

	bool tryQueryReceipt();


protected:
	model::hedera::TransactionResponse mTransactionResponse;
	model::hedera::TransactionReceipt* mTransactionReceipt;
	
	proto::TransactionID mTransactionID;
	proto::Duration      mValidDuration;

	// last time checked if transaction receipt is available
	Poco::Timestamp		mLastCheck;

	mutable std::shared_mutex mWorkingMutex;
};

#endif //__GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H