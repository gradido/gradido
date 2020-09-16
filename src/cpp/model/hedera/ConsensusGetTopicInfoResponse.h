#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H

#include "../proto/hedera/ConsensusGetTopicInfo.pb.h"

namespace model
{
	namespace hedera
	{
		class ConsensusGetTopicInfoResponse
		{
		public:
			ConsensusGetTopicInfoResponse();
			~ConsensusGetTopicInfoResponse();

		protected:
			proto::ConsensusGetTopicInfoResponse mProto;
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H