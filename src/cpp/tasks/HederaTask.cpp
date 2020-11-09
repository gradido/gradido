#include "HederaTask.h"
#include "../lib/DataTypeConverter.h"

#include "../proto/hedera/TransactionGetReceipt.pb.h"

HederaTask::HederaTask(const model::gradido::Transaction* transaction)
	: controller::PendingTask(new model::table::PendingTask), mTransactionReceipt(nullptr)
{
	auto hedera_task_model = getModel();
	auto gradido_task_model = transaction->getModel();
	hedera_task_model->setParentPendingTaskId(gradido_task_model->getID());
	hedera_task_model->setUserId(gradido_task_model->getUserId());
	hedera_task_model->setTaskType(model::table::TASK_TYPE_HEDERA_TOPIC_MESSAGE);
}

HederaTask::HederaTask(const model::hedera::Transaction* transaction)
: controller::PendingTask(new model::table::PendingTask), mTransactionReceipt(nullptr)
{
	auto hedera_task_model = getModel();
	//auto gradido_task_model = transaction->getModel();
	//hedera_task_model->setUserId(gradido_task_model->getUserId());
	model::table::TaskType task_type;
	auto transaction_type = transaction->getType();
	switch (transaction_type) {
	case model::hedera::TRANSACTION_CONSENSUS_CREATE_TOPIC:
		task_type = model::table::TASK_TYPE_HEDERA_TOPIC_CREATE; break;
	case model::hedera::TRANSACTION_CONSENSUS_SUBMIT_MESSAGE:
		task_type = model::table::TASK_TYPE_HEDERA_TOPIC_MESSAGE; break;
	case model::hedera::TRANSACTION_CRYPTO_CREATE:
		task_type = model::table::TASK_TYPE_HEDERA_ACCOUNT_CREATE; break;
	case model::hedera::TRANSACTION_CRYPTO_TRANSFER:
		task_type = model::table::TASK_TYPE_HEDERA_ACCOUNT_TRANSFER; break;
	}
	hedera_task_model->setTaskType(task_type);
	
}

HederaTask::HederaTask(model::table::PendingTask* dbModel)
    : controller::PendingTask(dbModel), mTransactionReceipt(nullptr)
{

}

HederaTask::~HederaTask()
{
	if (mTransactionReceipt) {
		delete mTransactionReceipt;
		mTransactionReceipt = nullptr;
	}
}

Poco::AutoPtr<HederaTask> HederaTask::load(model::table::PendingTask* dbModel)
{
	if (!dbModel || !dbModel->isHederaTransaction()) {
		return nullptr;
	}
	
	return new HederaTask(dbModel);
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