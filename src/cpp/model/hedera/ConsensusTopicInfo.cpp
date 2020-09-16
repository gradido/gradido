#include "ConsensusTopicInfo.h"

#include <sstream>
#include "../../lib/DataTypeConverter.h"
#include "Poco/DateTimeFormatter.h"

namespace model {
	namespace hedera {
		ConsensusTopicInfo::ConsensusTopicInfo(const proto::ConsensusTopicInfo& consensusTopicInfo)
			: mProto(consensusTopicInfo)
		{
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

		std::string ConsensusTopicInfo::toString()
		{
			std::stringstream ss;
			ss << "memo: " << mProto.memo() << std::endl;
			ss << "running hash: " << DataTypeConverter::binToHex((const unsigned char*)mProto.runninghash().data(), mProto.runninghash().size()) << std::endl;
			ss << "sequence number: " << mProto.sequencenumber() << std::endl;
			Poco::DateTime expiration_time = DataTypeConverter::convertFromProtoTimestamp(mProto.expirationtime());
			
			ss << "expiration time: " << Poco::DateTimeFormatter::format(expiration_time, "%f.%m.%Y %H:%M:%S") << std::endl;
			ss << "has admin key: " << mProto.has_adminkey() << std::endl;
			ss << "has submit key: " << mProto.has_submitkey() << std::endl;
			auto auto_renew_period = DataTypeConverter::convertFromProtoDuration(mProto.autorenewperiod());
			ss << "auto renew period: " << std::to_string(auto_renew_period.seconds()) << " seconds" << std::endl;
			auto acc_id = mProto.autorenewaccount();
			ss << "auto renew account: " << acc_id.shardnum() << ", " << acc_id.realmnum() << ", " << acc_id.accountnum() << std::endl;

			return ss.str();
		}

		std::string ConsensusTopicInfo::toStringHtml()
		{
			std::stringstream ss;
			ss << "<ul>";
			ss << "<li>memo: " << mProto.memo() << "</li>";
			ss << "<li>running hash: " << DataTypeConverter::binToHex((const unsigned char*)mProto.runninghash().data(), mProto.runninghash().size()) << "</li>";
			ss << "<li>sequence number: " << mProto.sequencenumber() << "</li>";
			Poco::DateTime expiration_time = DataTypeConverter::convertFromProtoTimestamp(mProto.expirationtime());

			ss << "<li>expiration time: " << Poco::DateTimeFormatter::format(expiration_time, "%f.%m.%Y %H:%M:%S") << "</li>";
			ss << "<li>has admin key: " << mProto.has_adminkey() << "</li>";
			ss << "<li>has submit key: " << mProto.has_submitkey() << "</li>";
			auto auto_renew_period = DataTypeConverter::convertFromProtoDuration(mProto.autorenewperiod());
			ss << "<li>auto renew period: " << std::to_string(mProto.autorenewperiod().seconds()) << " seconds" << "</li>";
			auto acc_id = mProto.autorenewaccount();
			ss << "<li>auto renew account: " << acc_id.shardnum() << ", " << acc_id.realmnum() << ", " << acc_id.accountnum() << "</li>";
			ss << "</ul>";

			return ss.str();
		}
	}
}