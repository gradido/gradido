#include "Group.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		Group::Group()
		{ 
		}

		Group::Group(const std::string& alias, const std::string& name, const std::string& url, const std::string& home, const std::string& description)
			: mAlias(alias), mName(name), mUrl(url), mHome(home), mDescription(description)
		{

		}

		Group::Group(GroupTuple tuple)
			: ModelBase(tuple.get<0>()),
			mAlias(tuple.get<1>()), mName(tuple.get<2>()), mUrl(tuple.get<3>()), mHome(tuple.get<4>()), mDescription(tuple.get<5>())
		{

		}

		Group::~Group() 
		{

		}

		std::string Group::toString()
		{
			std::stringstream ss;
			ss << "Alias: " << mAlias << std::endl;
			ss << "Name: " << mName << std::endl;
			ss << "Url: " << mUrl << std::endl;
			ss << "Home: " << mHome << std::endl;
			ss << "Description:" << mDescription << std::endl;
			return ss.str();
		}

		Poco::Data::Statement Group::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, alias, name, url, home, description FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mAlias), into(mName), into(mUrl), into(mHome), into(mDescription);

			return select;
		}

		Poco::Data::Statement Group::_loadAllFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, alias, name, url, home, description FROM " << getTableName();

			return select;
		}

		Poco::Data::Statement Group::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);
			// 		typedef Poco::Tuple<std::string, std::string, std::string, Poco::Nullable<Poco::Data::BLOB>, int> UserTuple;
			select << "SELECT id, alias, name, url, home, description FROM " << getTableName()
				<< " where " << fieldName << " LIKE ?";

			return select;
		}
		Poco::Data::Statement Group::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			select << "SELECT id FROM " << getTableName()
				<< " where alias = ?"
				, into(mID), use(mAlias);
			
			return select;

		}
		Poco::Data::Statement Group::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			insert << "INSERT INTO " << getTableName()
				<< " (alias, name, url, home, description) VALUES(?,?,?,?,?)"
				, use(mAlias), use(mName), use(mUrl), use(mHome), use(mDescription);
			
			return insert;
		}
	} 
}