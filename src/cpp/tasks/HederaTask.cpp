#include "HederaTask.h"
#include "../lib/DataTypeConverter.h"

#include "../proto/hedera/TransactionGetReceipt.pb.h"

HederaTask::HederaTask()
	: mTransactionReceipt(nullptr)
{

}

HederaTask::~HederaTask()
{
	if (mTransactionReceipt) {
		delete mTransactionReceipt;
		mTransactionReceipt = nullptr;
	}
}

bool HederaTask::isTimeout()
{
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	auto valid_start = mTransactionID.transactionvalidstart();
	auto poco_timestamp = DataTypeConverter::convertFromProtoTimestamp(valid_start);
	auto poco_duration = DataTypeConverter::convertFromProtoDuration(mValidDuration);
	return (poco_timestamp + poco_duration) > Poco::Timestamp();
}

void HederaTask::setTransactionReceipt(model::hedera::TransactionReceipt* transactionReceipt)
{
	assert(transactionReceipt);

	std::unique_lock<std::shared_mutex> _lock(mWorkingMutex);
	if (mTransactionReceipt) {
		printf("[HederaTask::setTransactionReceipt] warning, receipt already set\n");
		delete mTransactionReceipt;
	}
	mTransactionReceipt = transactionReceipt;
}

bool HederaTask::tryQueryReceipt()
{
	proto::TransactionGetReceiptQuery get_receipt_query;
	return true;
}