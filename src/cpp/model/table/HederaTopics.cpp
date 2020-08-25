#include "HederaTopics.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		HederaTopics::HederaTopics()
		{

		}

		HederaTopics::~HederaTopics()
		{

		}

		std::string HederaTopics::toString()
		{
			std::stringstream ss;
			ss << "Topic Hedera id: " << std::to_string(mTopicHederaId) << std::endl;
			ss << "Auto Renew Account Hedera id: " << std::to_string(mAutoRenewAccountHederaId) << std::endl;
			ss << "Auto Renew Period: " << std::to_string(mAutoRenewPeriod) << " seconds" << std::endl;
			ss << "Group id: " << std::to_string(mGroupId) << std::endl;
			ss << "Admin Key id: " << std::to_string(mAdminKeyId) << std::endl;
			ss << "Submit Key id: " << std::to_string(mSubmitKeyId) << std::endl;
			ss << "Hedera Topic Tiemout: " << Poco::DateTimeFormatter::format(mCurrentTimeout, "%f.%m.%Y %H:%M:%S") << std::endl;
			ss << "Hedera Topic Sequence Number: " << std::to_string(mSequenceNumber) << std::endl;
			ss << "Updated: " << Poco::DateTimeFormatter::format(mUpdated, "%f.%m.%Y %H:%M:%S") << std::endl;
			return ss.str();
		}

		Poco::Data::Statement HederaTopics::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, topic_hedera_id, auto_renew_account_hedera_id, auto_renew_period, " 
				   << "group_id, admin_key_id, submit_key_id, current_timeout, sequence_number, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mTopicHederaId), into(mAutoRenewAccountHederaId), into(mAutoRenewPeriod)
				, into(mGroupId), into(mAdminKeyId), into(mSubmitKeyId), into(mCurrentTimeout), into(mSequenceNumber), into(mUpdated);

			return select;

		}
		Poco::Data::Statement HederaTopics::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where topic_hedera_id = ?"
				, into(mID), use(mTopicHederaId);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaTopics::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (topic_hedera_id, auto_renew_account_hedera_id, auto_renew_period,"
				<< " group_id, admin_key_id, submit_key_id, current_timeout, sequence_number) VALUES(?,?,?,?,?,?,?,?)"
				, use(mTopicHederaId), use(mAutoRenewAccountHederaId), use(mAutoRenewPeriod)
				, use(mGroupId), use(mAdminKeyId), use(mSubmitKeyId), use(mCurrentTimeout), use(mSequenceNumber), use(mUpdated);
			unlock();
			return insert;
		}

	}
}