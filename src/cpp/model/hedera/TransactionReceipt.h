#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H

#include "../proto/hedera/TransactionReceipt.pb.h"
#include "../../SingletonManager/MemoryManager.h"

namespace model {
	namespace hedera {
		class TransactionReceipt
		{
		public:
			TransactionReceipt(const proto::TransactionReceipt& protoReceipt);
			~TransactionReceipt();

			proto::TopicID getTopicId() { return mProtoReceipt.topicid(); }
			google::protobuf::uint64 getSequenceNumber() { return mProtoReceipt.topicsequencenumber(); }
			google::protobuf::uint64 getRunningHashVersion() { return mProtoReceipt.topicrunninghashversion(); }
			//! caller must release memory after finish with it
			MemoryBin* getRunningHash();
			proto::ResponseCodeEnum getStatus() { return mProtoReceipt.status(); }

			inline proto::TransactionReceipt* getProto() { return &mProtoReceipt; }

		protected:
			proto::TransactionReceipt mProtoReceipt;
			
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H