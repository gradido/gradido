#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_IDS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_IDS_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, Poco::UInt64, Poco::UInt64, Poco::UInt64> HederaIdTuple;

		class HederaId : public ModelBase
		{
		public:
			HederaId();
			HederaId(Poco::UInt64 shardNum, Poco::UInt64 realmNum, Poco::UInt64 num);
			HederaId(const HederaIdTuple& tuple);
			~HederaId();

			// generic db operations
			const char* getTableName() const { return "hedera_ids"; }
			std::string toString();

			//! \brief check if hedera id already in db, then return id, else insert in db and return
			int getID();

			inline Poco::UInt64 getShardNum() const { return mShardNum; }
			inline Poco::UInt64 getRealmNum() const { return mRealmNum; }
			inline Poco::UInt64 getNum() const { return mNum; }

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