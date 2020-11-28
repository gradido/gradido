#include "HederaTask.h"
#include "../lib/DataTypeConverter.h"

#include "../proto/hedera/TransactionGetReceipt.pb.h"

#include "../controller/NodeServer.h"
#include "../controller/HederaAccount.h"
#include "../controller/HederaRequest.h"
#include "../controller/HederaTopic.h"

#include "../SingletonManager/PendingTasksManager.h"

HederaTask::HederaTask(const model::gradido::Transaction* transaction)
	: controller::PendingTask(new model::table::PendingTask), mTransactionReceipt(nullptr), mTryCount(0)
{
	auto hedera_task_model = getModel();
	auto gradido_task_model = transaction->getModel();
	hedera_task_model->setParentPendingTaskId(gradido_task_model->getID());
	hedera_task_model->setUserId(gradido_task_model->getUserId());
	hedera_task_model->setTaskType(model::table::TASK_TYPE_HEDERA_TOPIC_MESSAGE);
}

HederaTask::HederaTask(const model::hedera::Transaction* transaction)
: controller::PendingTask(new model::table::PendingTask), mTransactionReceipt(nullptr), mTryCount(0)
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
	mTransactionID = transaction->getTransactionId();
}

HederaTask::HederaTask(model::table::PendingTask* dbModel)
    : controller::PendingTask(dbModel), mTransactionReceipt(nullptr), mTryCount(0)
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


Poco::DateTime HederaTask::getNextRunTime()
{
	printf("[HederaTask::getNextRunTime]\n");
	std::shared_lock<std::shared_mutex> _lock(mWorkingMutex);
	return mLastCheck + 2000 * mTryCount * 2000;
}

int HederaTask::run()
{
	auto result = tryQueryReceipt();
	// keep also by -1 task in db for debugging
	if (result != 1 && result != -1) {
		deleteFromDB();
		
	}
	if (result == -1 ) {
		return 0;
	}

	return result;
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

//! \return 0 by success
//! \return 1 if hedera query failed
//! \return -1 if run after failed
//! \return -2 if not enough data for query
//! \return -3 if error in query

int HederaTask::tryQueryReceipt()
{
	printf("[HederaTask::tryQueryReceipt]\n");
	static const char* function_name = "HederaTask::tryQueryReceipt";
	std::unique_lock<std::shared_mutex> _lock(mWorkingMutex);
	auto node_server_type = model::table::HederaAccount::networkTypeToNodeServerType(ServerConfig::g_HederaNetworkType);
	auto connection = controller::NodeServer::pick(node_server_type);
	if (!connection.isValid()) {
		addError(new ParamError(function_name, "couldn't find node server for server type: ", model::table::NodeServer::nodeServerTypeToString(node_server_type)));
		return -2;
	}
	auto operator_account = controller::HederaAccount::pick(ServerConfig::g_HederaNetworkType, false);
	if (operator_account.isNull()) {
		addError(new ParamError(function_name, "couldn't find unencrypted operator account for hedera network type: ", ServerConfig::g_HederaNetworkType));
		return -2;
	}
	//auto query = model::hedera::Query::getTransactionGetReceiptQuery(mTransactionID, operator_account, connection);
	auto query = model::hedera::Query::getTransactionGetReceiptQuery(mTransactionID, operator_account, connection);
	HederaRequest request;
	model::hedera::Response response;
	try {
		if (HEDERA_REQUEST_RETURN_OK == request.request(query, &response)) {
			mTransactionReceipt = response.getTransactionReceipt();
			if (mTransactionReceipt) {
				if (runAfterGettingReceipt()) {
					return 0;
				}
				else {
					return -1;
				}
			}
		}
		else {
			if (response.getResponseCode() == proto::NOT_SUPPORTED) {

				return -3;
			}
			mLastCheck = Poco::Timestamp();
			mTryCount++;
		}
	}
	catch (std::exception& ex) {
		addError(new ParamError(function_name, "exception calling hedera request: ", ex.what()));
		mLastCheck = Poco::Timestamp();
		mTryCount++;
	}


	return 1;
}

bool HederaTask::runAfterGettingReceipt()
{
	assert(getModel());
	auto type = getModel()->getTaskType();
	switch (type) {
	case model::table::TASK_TYPE_HEDERA_TOPIC_CREATE:
		return runForHederaTopic();
	case model::table::TASK_TYPE_HEDERA_TOPIC_MESSAGE:
	case model::table::TASK_TYPE_HEDERA_ACCOUNT_CREATE:
	case model::table::TASK_TYPE_HEDERA_ACCOUNT_TRANSFER:
		return false;
	}
	return true;
}

bool HederaTask::runForHederaTopic()
{
	static const char* function_name = "HederaTask::runForHederaTopic";
	// parent pending task is set to hedera_topic.id in db
	auto model = getModel();
	auto hedera_topic = controller::HederaTopic::load(model->getParentPendingTaskId());
	if (!hedera_topic.isNull()) {
		auto hedera_topic_model = hedera_topic->getModel();
		auto topic_id = mTransactionReceipt->getTopicId();
		auto hedera_id = controller::HederaId::create(topic_id.shardnum(), topic_id.realmnum(), topic_id.topicnum());
		if (!hedera_id->getModel()->insertIntoDB(true)) {
			addError(new Error(function_name, "error saving hedera_id"));
			addError(new ParamError(function_name, "for hedera topic: ", hedera_topic_model->getID()));
			addError(new ParamError(function_name, "shardnum: ", topic_id.shardnum()));
			addError(new ParamError(function_name, "realmnum: ", topic_id.realmnum()));
			addError(new ParamError(function_name, "topicnum", topic_id.topicnum()));

			return false;
		}
		hedera_topic_model->setTopicHederaID(hedera_id->getModel()->getID());
		hedera_topic_model->setSequeceNumber(mTransactionReceipt->getSequenceNumber());
		std::string fieldNames[] = { "topic_hedera_id", "sequence_number" };
		if (1 != hedera_topic_model->updateIntoDB(
			fieldNames,
			hedera_topic_model->getTopicHederaId(),
			hedera_topic_model->getSequenceNumber()
		)) {
			addError(new Error(function_name, "error updating topic id"));
			addError(new ParamError(function_name, "for hedera topic: ", hedera_topic_model->getID()));
			addError(new ParamError(function_name, "shardnum: ", topic_id.shardnum()));
			addError(new ParamError(function_name, "realmnum: ", topic_id.realmnum()));
			addError(new ParamError(function_name, "topicnum", topic_id.topicnum()));
			return false;
		}
		//! TODO think about saving also the last running hash

	}
	else {
		addError(new ParamError(function_name, "hedera topic not found, id: ", model->getParentPendingTaskId()));
		return false;
	}
	return true;
}