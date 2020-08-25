#include "HederaIds.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		HederaIds::HederaIds()
		{

		}

		HederaIds::~HederaIds()
		{

		}

		std::string HederaIds::toString()
		{
			std::stringstream ss;
			ss << "Shard Num: " << std::to_string(mShardNum) << std::endl;
			ss << "Realm Num: " << std::to_string(mRealmNum) << std::endl;
			ss << "Num: " << std::to_string(mNum) << std::endl;
			return ss.str();
		}

		Poco::Data::Statement HederaIds::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{

			Poco::Data::Statement select(session);

			select << "SELECT id, shardNum, realmNum, num FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mShardNum), into(mRealmNum), into(mNum);

			return select;
		}
		Poco::Data::Statement HederaIds::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where shardNum = ? AND realmNum = ? AND num = ?"
				, into(mID), use(mShardNum), use(mRealmNum), use(mNum);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaIds::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (shardNum, realmNum, num) VALUES(?,?,?)"
				, use(mShardNum), use(mRealmNum), use(mNum);
			unlock();
			return insert;
		}
	}
}