
#include "Group.h"

namespace controller {

	Group::Group(model::table::Group* dbModel)
	{
		mDBModel = dbModel;
	}

	Group::~Group()
	{

	}

	Poco::AutoPtr<Group> Group::create(const std::string& alias, const std::string& name, const std::string& url, const std::string& home, const std::string& description)
	{
		auto db = new model::table::Group(alias, name, url, home, description);
		auto group = new Group(db);
		return Poco::AutoPtr<Group>(group);
	}

	std::vector<Poco::AutoPtr<Group>> Group::load(const std::string& alias)
	{
		auto db = new model::table::Group();
		auto group_list = db->loadFromDB<std::string, model::table::GroupTuple>("alias", alias, 1);

		std::vector<Poco::AutoPtr<Group>> resultVector;
		resultVector.reserve(group_list.size());
		for (auto it = group_list.begin(); it != group_list.end(); it++) {
			resultVector.push_back(new Group(new model::table::Group(*it)));
		}
		return resultVector;
	}

	Poco::AutoPtr<Group> Group::load(int id)
	{
		auto db = new model::table::Group();
		if (1 == db->loadFromDB("id", id)) {
			return new Group(db);
		}
		else {
			return nullptr;
		}
	}

	
	std::vector<Poco::AutoPtr<Group>> Group::listAll()
	{
		auto db = new model::table::Group();
		std::vector<model::table::GroupTuple> group_list;
		// throw an unresolved external symbol error
		//group_list = db->loadAllFromDB<model::table::GroupTuple>();
		
		// work around for not working call to loadAllFromDB
		auto cm = ConnectionManager::getInstance();
		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);

		select << "SELECT id, alias, name, url, home, description FROM " << db->getTableName()
		, Poco::Data::Keywords::into(group_list);

		size_t resultCount = 0;
		try {
			resultCount = select.execute();
		}
		catch (Poco::Exception& ex) {
			printf("[Group::listAll] poco exception: %s\n", ex.displayText().data());
		}
		// work around end
		std::vector<Poco::AutoPtr<Group>> resultVector;
		
		resultVector.reserve(group_list.size());
		for (auto it = group_list.begin(); it != group_list.end(); it++) {
			Poco::AutoPtr<Group> group_ptr(new Group(new model::table::Group(*it)));
			resultVector.push_back(group_ptr);
		}
		return resultVector;
	}
	
}

