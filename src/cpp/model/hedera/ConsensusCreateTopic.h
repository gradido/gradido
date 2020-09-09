#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_CREATE_TOPIC_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_CREATE_TOPIC_H

#include "../../proto/hedera/ConsensusCreateTopic.pb.h"
#include "../../SingletonManager/MemoryManager.h"

#include "../../controller/HederaId.h"

namespace model {
	namespace hedera {
		class ConsensusCreateTopic 
		{
		public:
			ConsensusCreateTopic(Poco::AutoPtr<controller::HederaId> autoRenewHederaAccountId, Poco::UInt32 autoRenewPeriod);
			~ConsensusCreateTopic();

			inline void setMemo(const std::string& memo) { mProtoCreateTopic->set_memo(memo); }
			void setAdminKey(const MemoryBin* adminPublicKey);
			void setSubmitKey(const MemoryBin* submitPublicKey);

			bool validate();

			inline proto::ConsensusCreateTopicTransactionBody* getProtoTransactionBody() { return mProtoCreateTopic; }
			inline void resetPointer() { mProtoCreateTopic = nullptr; }
		protected:
			proto::ConsensusCreateTopicTransactionBody* mProtoCreateTopic;
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_CREATE_TOPIC_H