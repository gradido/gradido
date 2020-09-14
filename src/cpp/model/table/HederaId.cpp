#include "HederaId.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		HederaId::HederaId()
			: mShardNum(0), mRealmNum(0), mNum(0)
		{

		}

		HederaId::HederaId(Poco::UInt64 shardNum, Poco::UInt64 realmNum, Poco::UInt64 num)
			: mShardNum(shardNum), mRealmNum(realmNum), mNum(num) 
		{

		}

		HederaId::HederaId(const HederaIdTuple& tuple)
			: ModelBase(tuple.get<0>()),
			mShardNum(tuple.get<1>()), mRealmNum(tuple.get<2>()), mNum(tuple.get<3>())
		{

		}

		HederaId::~HederaId()
		{

		}

		std::string HederaId::toString()
		{
			std::stringstream ss;
			ss << std::to_string(mShardNum) << "." << std::to_string(mRealmNum) << "." << std::to_string(mNum) << std::endl;
			return ss.str();
		}

		int HederaId::getID()
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			assert(mNum != 0|| mShardNum != 0 || mRealmNum != 0);
			if (mID) return mID;

			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select(session);
			select << "SELECT id FROM " << getTableName()
				<< " where shardNum = ? AND realmNum = ? AND num = ?"
				, into(mID), use(mShardNum), use(mRealmNum), use(mNum);

			try {
				if (1 == select.execute()) {
					return mID;
				}
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError("HederaId::getID", "mysql error try to find existing entry", ex.message()));
				sendErrorsAsEmail();
			}
			insertIntoDB(true);
			return mID;
		}


		Poco::Data::Statement HederaId::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{

			Poco::Data::Statement select(session);

			select << "SELECT id, shardNum, realmNum, num FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mShardNum), into(mRealmNum), into(mNum);

			return select;
		}
		Poco::Data::Statement HederaId::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where shardNum = ? AND realmNum = ? AND num = ?"
				, into(mID), use(mShardNum), use(mRealmNum), use(mNum);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaId::_insertIntoDB(Poco::Data::Session session)
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