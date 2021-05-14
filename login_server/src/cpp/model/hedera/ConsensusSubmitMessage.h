#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_SUBMIT_MESSAGE_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_SUBMIT_MESSAGE_H

#include "proto/hedera/ConsensusSubmitMessage.pb.h"
#include "../../controller/HederaId.h"

namespace model {
	namespace hedera {

		class ConsensusSubmitMessage
		{
		public:
			ConsensusSubmitMessage(Poco::AutoPtr<controller::HederaId> topicID);
			~ConsensusSubmitMessage();

			inline proto::ConsensusSubmitMessageTransactionBody* getProtoTransactionBody() { return mConsensusMessageBody; }
			inline void resetPointer() { mConsensusMessageBody = nullptr; }
			void setMessage(std::string byteString);
			inline void setMessage(const MemoryBin* message) { setMessage(std::string((const char*)message->data(), message->size())); }

			bool validate();



		protected:
			proto::ConsensusSubmitMessageTransactionBody* mConsensusMessageBody;

		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_SUBMIT_MESSAGE_H
