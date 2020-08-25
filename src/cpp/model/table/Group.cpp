#include "Group.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		Group::Group()
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
			ss << "Description:" << mDescription << std::endl;
			return ss.str();
		}

		Poco::Data::Statement Group::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, alias, name, description FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mAlias), into(mName), into(mDescription);

			return select;
		}
		Poco::Data::Statement Group::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where alias = ?"
				, into(mID), use(mAlias);
			unlock();
			return select;

		}
		Poco::Data::Statement Group::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (alias, name, description) VALUES(?,?,?)"
				, use(mAlias), use(mName), use(mDescription);
			unlock();
			return insert;
		}
	} 
}