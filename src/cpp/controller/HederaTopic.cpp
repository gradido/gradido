#include "HederaTopic.h"
//#include "../model/hedera/Transaction.h"
#include "HederaRequest.h"
#include "../lib/Success.h"

namespace controller {
	HederaTopic::HederaTopic(model::table::HederaTopic* dbModel)
	{
		mDBModel = dbModel;
	}
	HederaTopic::~HederaTopic()
	{

	}

	Poco::AutoPtr<HederaTopic> HederaTopic::create(const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId)
	{
		auto db = new model::table::HederaTopic(name, autoRenewAccountId, autoRenewPeriod, groupId);

		auto hedera_topic = new HederaTopic(db);
		return Poco::AutoPtr<HederaTopic>(hedera_topic);
	}

	std::vector<Poco::AutoPtr<HederaTopic>> HederaTopic::listAll()
	{
		auto db = new model::table::HederaTopic();
		std::vector<model::table::HederaTopicTuple> topic_list;
		// throw an unresolved external symbol error
		topic_list = db->loadAllFromDB<model::table::HederaTopicTuple>();

		
		std::vector<Poco::AutoPtr<HederaTopic>> resultVector;

		resultVector.reserve(topic_list.size());
		for (auto it = topic_list.begin(); it != topic_list.end(); it++) {
			Poco::AutoPtr<HederaTopic> topic_ptr(new HederaTopic(new model::table::HederaTopic(*it)));
			resultVector.push_back(topic_ptr);
		}
		return resultVector;
	}

	Poco::AutoPtr<HederaTopic> HederaTopic::load(int id)
	{
		auto db = new model::table::HederaTopic;
		if (1 == db->loadFromDB("id", id)) {
			return new HederaTopic(db);
		}
		return nullptr;
	}

	Poco::AutoPtr<HederaId> HederaTopic::getTopicHederaId()
	{
		if (mTopicHederaId.isNull()) {
			mTopicHederaId = HederaId::load(getModel()->getTopicHederaId());
		}
		return mTopicHederaId;
	}

	Poco::AutoPtr<HederaAccount> HederaTopic::getAutoRenewAccount()
	{
		if (mAutoRenewAccount.isNull()) {
			mAutoRenewAccount = HederaAccount::load(getModel()->getAutoRenewAccountId());
		}
		return mAutoRenewAccount;
	}

	Poco::UInt64 HederaTopic::hederaCreateTopic()
	{
		return 0;
	}

	bool HederaTopic::updateWithGetTopicInfos(Poco::AutoPtr<User> user)
	{
		auto payer_account = getAutoRenewAccount();
		auto node_server = NodeServer::pick(payer_account->getModel()->getNetworkType(), getModel()->getGroupId());
		auto query = model::hedera::Query::getTopicInfo(getTopicHederaId(), payer_account->getHederaId(), node_server);
		query->setResponseType(proto::ANSWER_ONLY);
		model::hedera::Response response;
		HederaRequest request;
		query->sign(payer_account->getCryptoKey()->getKeyPair(user));
		if (HEDERA_REQUEST_RETURN_OK == request.request(query, &response)) {
			auto queryCost = response.getQueryCost();
			printf("query cost: %d\n", queryCost);

			query->setTransactionFee(queryCost);
			query->setResponseType(proto::ANSWER_ONLY);
			query->sign(payer_account->getCryptoKey()->getKeyPair(user));
	

			if (HEDERA_REQUEST_RETURN_OK == request.request(query, &response)) {
				auto consensus_topic_info = response.getConsensusTopicInfo();
				addNotification(new ParamSuccess("consensus get topic info", "memo: ", consensus_topic_info->getMemo()));
				auto model = getModel();
				model->setAutoRenewPeriod(consensus_topic_info->getAutoRenewPeriod().seconds());
				model->setCurrentTimeout(consensus_topic_info->getExpirationTime());
				model->setSequeceNumber(consensus_topic_info->getSequenceNumber());
				std::string fieldNames[] = { "auto_renew_period", "current_timeout", "sequence_number" };
				if (model->updateIntoDB(
					fieldNames,
					model->getAutoRenewPeriod(),
					model->getCurrentTimeout(),
					model->getSequenceNumber()
				) != 1) {
					addError(new Error("DB", "error saving changes in DB"));
					getErrors(model);
					return false;
				}
				return true;
				
			}
			else {
				addError(new Error("Hedera Query", "Error by query for consensus get topic info"));
			}
		
		}
		else {
			addError(new Error("Hedera Query", "Error by getting costs for consensus get topic info"));
		}
		
		getErrors(&request);
		return false;
		
	}
}