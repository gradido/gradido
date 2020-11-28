

#include "ConsensusCreateTopic.h"

namespace model {
	namespace hedera {
		ConsensusCreateTopic::ConsensusCreateTopic(Poco::AutoPtr<controller::HederaId> autoRenewHederaAccountId, Poco::UInt32 autoRenewPeriod)
			: mProtoCreateTopic(nullptr)
		{
			mProtoCreateTopic = new proto::ConsensusCreateTopicTransactionBody;
			auto auto_renew_period = mProtoCreateTopic->mutable_autorenewperiod();
			auto_renew_period->set_seconds(autoRenewPeriod);

			if (!autoRenewHederaAccountId.isNull()) {
				auto auto_renew_account = mProtoCreateTopic->mutable_autorenewaccount();
				autoRenewHederaAccountId->copyToProtoAccountId(auto_renew_account);
			}

		}
		ConsensusCreateTopic::~ConsensusCreateTopic()
		{
			if (mProtoCreateTopic) {
				delete mProtoCreateTopic;
				mProtoCreateTopic = nullptr;
			}
		}

		void ConsensusCreateTopic::setAdminKey(const MemoryBin* adminPublicKey)
		{
			auto admin_key = mProtoCreateTopic->mutable_adminkey();
			auto admin_key_string = admin_key->mutable_ed25519();
			*admin_key_string = std::string((const char)*adminPublicKey, adminPublicKey->size());
		}
		void ConsensusCreateTopic::setSubmitKey(const MemoryBin* submitPublicKey)
		{
			auto submit_key = mProtoCreateTopic->mutable_submitkey();
			auto submit_key_string = submit_key->mutable_ed25519();
			*submit_key_string = std::string((const char)*submitPublicKey, submitPublicKey->size());
		}

		bool ConsensusCreateTopic::validate()
		{
			
			if (mProtoCreateTopic->autorenewperiod().seconds() == 7890000) {// && 0 != mProtoCreateTopic->autorenewaccount().accountnum()) { 
				return true; 
			}
			return false;
		}
	}
}
