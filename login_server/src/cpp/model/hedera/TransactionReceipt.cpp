#include "TransactionReceipt.h"

namespace model {
	namespace hedera {

		TransactionReceipt::TransactionReceipt(const proto::TransactionReceipt& protoReceipt)
			: mProtoReceipt(protoReceipt)
		{

		}

		TransactionReceipt::~TransactionReceipt()
		{

		}

		MemoryBin* TransactionReceipt::getRunningHash()
		{
			auto hash = mProtoReceipt.topicrunninghash();
			auto hashBin = MemoryManager::getInstance()->getFreeMemory(hash.size());
			memcpy(*hashBin, hash.data(), hash.size());
			return hashBin;
		}
	}
}