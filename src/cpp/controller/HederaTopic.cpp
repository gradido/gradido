#include "HederaTopic.h"
//#include "../model/hedera/Transaction.h"

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
}