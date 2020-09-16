#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H

#include "../proto/hedera/ConsensusTopicInfo.pb.h"
#include "../SingletonManager/MemoryManager.h"
#include "../../lib/DataTypeConverter.h"
#include "Poco/DateTime.h"

namespace model
{
	namespace hedera
	{
		class ConsensusTopicInfo
		{
		public:
			ConsensusTopicInfo(const proto::ConsensusTopicInfo& consensusTopicInfo);
			~ConsensusTopicInfo();

			inline std::string getMemo() const { return mProto.memo(); }
			MemoryBin* getRunningHashCopy() const;
			Poco::UInt64 getSequenceNumber() const { return mProto.sequencenumber(); }
			inline Poco::DateTime getExpirationTime() const { return DataTypeConverter::convertFromProtoTimestamp(mProto.expirationtime());}
			inline proto::Duration getAutoRenewPeriod() const { return mProto.autorenewperiod(); }

			std::string toString();
			std::string toStringHtml();

		protected:
			proto::ConsensusTopicInfo mProto;
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CONSENSUS_GET_TOPIC_INFO_RESPONSE_H