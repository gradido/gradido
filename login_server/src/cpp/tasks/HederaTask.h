#ifndef __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H
#define __GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H

#include "../model/hedera/TransactionResponse.h"
#include "../model/hedera/TransactionReceipt.h"
#include "../model/hedera/Transaction.h"
#include "../model/hedera/Query.h"
#include "../proto/hedera/BasicTypes.pb.h"
#include "../proto/hedera/Duration.pb.h"

#include "../model/gradido/Transaction.h"

#include "../controller/PendingTask.h"
#include "../controller/HederaAccount.h"

#include "Poco/Timestamp.h"

#include <shared_mutex>

/*!
 * 
 * \brief: Managing hedera task, especially check on receipt availability 
 * 
 * \author: Dario Rekowski
 *
 */

class HederaTask : public controller::PendingTask, public NotificationList
{
public:

	HederaTask(const model::gradido::Transaction* transaction);
	HederaTask(const model::hedera::Transaction* transaction);
	HederaTask(model::table::PendingTask* dbModel);
	//HederaTask(model::hedera::Query)
	~HederaTask();

	static Poco::AutoPtr<HederaTask> load(model::table::PendingTask* dbModel);

	inline model::hedera::TransactionResponse* getTransactionResponse() { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return &mTransactionResponse; }
	inline void setTransactionId(const proto::TransactionID& transactionId) { std::unique_lock<std::shared_mutex> _lock(mWorkingMutex); mTransactionID = transactionId; }
	inline void setValidDuration(const proto::Duration& validDuration) { std::unique_lock<std::shared_mutex> _lock(mWorkingMutex); mValidDuration = validDuration; }
	//! \param transactionReceipt take ownership and call delete if done
	void setTransactionReceipt(model::hedera::TransactionReceipt* transactionReceipt);

	inline const proto::TransactionID& getTransactionId() const { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mTransactionID; }
	inline const proto::Duration& getDuration() const { std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mValidDuration; }
	inline const model::hedera::TransactionReceipt* getTransactionReceipt() const{ std::shared_lock<std::shared_mutex> _lock(mWorkingMutex); return mTransactionReceipt; }


	bool isTimeoutTask() { return true; }
	Poco::DateTime getNextRunTime();
	int run();

	//! \return 0 by success
	//! \return 1 if hedera query failed
	//! \return -1 if run after failed
	//! \return -2 if not enough data for query
	int tryQueryReceipt();


protected:

	bool runAfterGettingReceipt();
	bool runForHederaTopic();

	model::hedera::TransactionResponse mTransactionResponse;
	model::hedera::TransactionReceipt* mTransactionReceipt;
	
	
	proto::TransactionID mTransactionID;
	proto::Duration      mValidDuration;

	// last time checked if transaction receipt is available
	Poco::Timestamp		mLastCheck;
	int					mTryCount;

	mutable std::shared_mutex mWorkingMutex;
};

#endif //__GRADIDO_LOGIN_TASKS_HEDERA_TASKS_H