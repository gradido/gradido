#include "ConsensusSubmitMessage.h"

namespace model {
	namespace hedera {
		ConsensusSubmitMessage::ConsensusSubmitMessage(Poco::AutoPtr<controller::HederaId> topicID)
			: mConsensusMessageBody(nullptr)
		{
			mConsensusMessageBody = new proto::ConsensusSubmitMessageTransactionBody;
			topicID->copyToProtoTopicId(mConsensusMessageBody->mutable_topicid());
		}

		ConsensusSubmitMessage::~ConsensusSubmitMessage()
		{
			if (mConsensusMessageBody) {
				delete mConsensusMessageBody;
				mConsensusMessageBody = nullptr;
			}
		}

		bool ConsensusSubmitMessage::validate()
		{
			// TODO: unpack gradido transaction and make simple validation check
			assert(mConsensusMessageBody);
			if (0 == mConsensusMessageBody->message().size()) {
				printf("[ConsensusSubmitMessage::validate] empty message\n");
				return false;
			}
			if (!mConsensusMessageBody->has_topicid()) {
				printf("[ConsensusSubmitMessage::validate] empty topic id\n");
				return false;
			}
		
			return true;
		}

		void ConsensusSubmitMessage::setMessage(std::string byteString)
		{
			assert(mConsensusMessageBody);
			mConsensusMessageBody->set_message(byteString);
		}
	}
}