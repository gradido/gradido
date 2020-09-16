#include "ConsensusTopicInfo.h"

namespace model {
	namespace hedera {
		ConsensusTopicInfo::ConsensusTopicInfo(const proto::ConsensusTopicInfo& consensusTopicInfo)
			: mProto(consensusTopicInfo)
		{
			int zahl = 1;
		}

		ConsensusTopicInfo::~ConsensusTopicInfo()
		{

		}

		MemoryBin* ConsensusTopicInfo::getRunningHashCopy() const
		{
			auto mm = MemoryManager::getInstance();
			auto running_hash = mProto.runninghash();
			auto running_hash_bin = mm->getFreeMemory(running_hash.size());
			memcpy(*running_hash_bin, running_hash.data(), running_hash.size());
			return running_hash_bin;
		}

	}
}