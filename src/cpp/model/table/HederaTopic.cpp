#include "HederaTopic.h"
#include "Poco/DateTimeFormatter.h"
using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		HederaTopic::HederaTopic()
			: mTopicHederaId(0), mAutoRenewAccountHederaId(0), mAutoRenewPeriod(0), mGroupId(0), mAdminKeyId(0), mSubmitKeyId(0),mSequenceNumber(0)
		{

		}

		HederaTopic::HederaTopic(const HederaTopicTuple& tuple)
			: ModelBase(tuple.get<0>()), mTopicHederaId(tuple.get<1>()), mName(tuple.get<2>()), mAutoRenewAccountHederaId(tuple.get<3>()),
			  mAutoRenewPeriod(tuple.get<4>()), mGroupId(tuple.get<5>()), mAdminKeyId(tuple.get<6>()), mSubmitKeyId(tuple.get<7>()),  
			mCurrentTimeout(tuple.get<8>()), mSequenceNumber(tuple.get<9>()), mUpdated(tuple.get<10>())
		{

		}

		HederaTopic::HederaTopic(const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId)
			: mTopicHederaId(0), mName(name), mAutoRenewAccountHederaId(autoRenewAccountId), mAutoRenewPeriod(autoRenewPeriod), mGroupId(groupId),
				mAdminKeyId(0), mSubmitKeyId(0), mSequenceNumber(0)
		{

		}

		HederaTopic::~HederaTopic()
		{			
		}

		std::string HederaTopic::toString()
		{
			std::stringstream ss;
			ss << std::endl;
			ss << "Topic Hedera id: " << std::to_string(mTopicHederaId) << std::endl;
			ss << "Name: " << mName << std::endl;
			ss << "Auto Renew Account Hedera id: " << std::to_string(mAutoRenewAccountHederaId) << std::endl;
			ss << "Auto Renew Period: " << std::to_string(mAutoRenewPeriod) << " seconds" << std::endl;
			ss << "Group id: " << std::to_string(mGroupId) << std::endl;
			ss << "Admin Key id: " << std::to_string(mAdminKeyId) << std::endl;
			ss << "Submit Key id: " << std::to_string(mSubmitKeyId) << std::endl;
			ss << "Hedera Topic Timeout: " << Poco::DateTimeFormatter::format(mCurrentTimeout, "%f.%m.%Y %H:%M:%S") << std::endl;
			ss << "Hedera Topic Sequence Number: " << std::to_string(mSequenceNumber) << std::endl;
			ss << "Updated: " << Poco::DateTimeFormatter::format(mUpdated, "%f.%m.%Y %H:%M:%S") << std::endl;
			return ss.str();
		}

		std::string HederaTopic::getAutoRenewPeriodString() const
		{
			return secondsToReadableDuration(mAutoRenewPeriod) + " (" + std::to_string(mAutoRenewPeriod) + " seconds)";
		}

		std::string HederaTopic::getCurrentTimeoutString() const
		{
			return Poco::DateTimeFormatter::format(mCurrentTimeout, "%Y-%m-%d %H:%M:%S");
		}
		std::string HederaTopic::getUpdatedString() const
		{
			return Poco::DateTimeFormatter::format(mUpdated, "%Y-%m-%d %H:%M:%S");
		}

		Poco::Data::Statement HederaTopic::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, topic_hedera_id, name, auto_renew_account_hedera_id, auto_renew_period, " 
				   << "group_id, admin_key_id, submit_key_id, current_timeout, sequence_number, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mTopicHederaId), into(mName), into(mAutoRenewAccountHederaId), into(mAutoRenewPeriod)
				, into(mGroupId), into(mAdminKeyId), into(mSubmitKeyId), into(mCurrentTimeout), into(mSequenceNumber), into(mUpdated);

			return select;

		}
		Poco::Data::Statement HederaTopic::_loadAllFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			//typedef Poco::Tuple<int, int, std::string, int, Poco::UInt32, int, int, int, Poco::DateTime, Poco::UInt64, Poco::DateTime> HederaTopicTuple;

			select << "SELECT id, topic_hedera_id, name, auto_renew_account_hedera_id, auto_renew_period, "
				<< "group_id, admin_key_id, submit_key_id, current_timeout, sequence_number, updated FROM " << getTableName();

			return select;
		}
		Poco::Data::Statement HederaTopic::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where topic_hedera_id = ? "
				<< " AND name = ? "
				, into(mID), use(mTopicHederaId), use(mName);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaTopic::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (topic_hedera_id, name, auto_renew_account_hedera_id, auto_renew_period,"
				<< " group_id, admin_key_id, submit_key_id, current_timeout, sequence_number) VALUES(?,?,?,?,?,?,?,?,?)"
				, use(mTopicHederaId), use(mName), use(mAutoRenewAccountHederaId), use(mAutoRenewPeriod)
				, use(mGroupId), use(mAdminKeyId), use(mSubmitKeyId), use(mCurrentTimeout), use(mSequenceNumber);
			unlock();
			return insert;
		}

	}
}