#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_IDS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_IDS_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"

namespace model {
	namespace table {

		class HederaIds : public ModelBase
		{
		public:
			HederaIds();
			~HederaIds();

			// generic db operations
			const char* getTableName() const { return "hedera_ids"; }
			std::string toString();


		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::UInt64 mShardNum;
			Poco::UInt64 mRealmNum;
			Poco::UInt64 mNum;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_IDS_INCLUDE