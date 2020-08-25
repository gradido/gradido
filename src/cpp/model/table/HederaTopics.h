#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_TOPICS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_TOPICS_INCLUDE

#include "ModelBase.h"

namespace model {
	namespace table {

		class HederaTopics : public ModelBase
		{
		public:
			HederaTopics();
			~HederaTopics();

			// generic db operations
			const char* getTableName() const { return "hedera_topics"; }
			std::string toString();


		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::UInt32 mTopicHederaId;
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