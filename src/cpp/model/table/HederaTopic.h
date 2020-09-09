#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_TOPICS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_TOPICS_INCLUDE

#include "ModelBase.h"

namespace model {
	namespace table {

		class HederaTopic : public ModelBase
		{
		public:
			HederaTopic();
			HederaTopic(const std::string& name, int autoRenewAccountId, int autoRenewPeriod, int groupId);
			~HederaTopic();

			// generic db operations
			const char* getTableName() const { return "hedera_topics"; }
			std::string toString();

			inline Poco::UInt32 getTopicHederaId() const { return mTopicHederaId; }
			inline std::string getName() const { return mName; }
			inline Poco::UInt32	getAutoRenewAccountId() const { return mAutoRenewAccountHederaId; }
			inline Poco::UInt32 getAutoRenewPeriod() const { return mAutoRenewPeriod; }
			inline Poco::UInt32 getGroupId() const { return mGroupId;}
			inline Poco::DateTime getCurrentTimoout() const { return mCurrentTimeout; }
			inline Poco::UInt64 getSequenceNumber() const { return mSequenceNumber; }
			inline Poco::DateTime getUpdated() const { return mUpdated; }

			inline void setTopicHederaID(Poco::UInt32 topidHederaId) { mTopicHederaId = topidHederaId;}
			inline void setSequeceNumber(Poco::UInt64 sequenceNumber) { mSequenceNumber = sequenceNumber; }
			inline void setCurrentTimeout(Poco::DateTime currentTimeOut) { mCurrentTimeout = currentTimeOut; }

		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::UInt32 mTopicHederaId;
			std::string mName;
			Poco::UInt32 mAutoRenewAccountHederaId;
			// in seconds
			Poco::UInt32 mAutoRenewPeriod;
			Poco::UInt32 mGroupId;
			Poco::UInt32 mAdminKeyId;
			Poco::UInt32 mSubmitKeyId;
			Poco::DateTime mCurrentTimeout;
			Poco::UInt64 mSequenceNumber;
			Poco::DateTime mUpdated;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_TOPICS_INCLUDE