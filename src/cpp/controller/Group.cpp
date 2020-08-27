
#include "Group.h"

namespace controller {

	Group::Group(model::table::Group* dbModel)
	{
		mDBModel = dbModel;
	}

	Group::~Group()
	{

	}

	Poco::AutoPtr<Group> Group::create(const std::string& alias, const std::string& name, const std::string& url, const std::string& description)
	{
		auto db = new model::table::Group(alias, name, url, description);
		auto group = new Group(db);
		return Poco::AutoPtr<Group>(group);
	}

	std::vector<Poco::AutoPtr<Group>> Group::load(const std::string& alias)
	{
		auto db = new model::table::Group();
		auto group_list = db->loadFromDB<std::string, model::table::GroupTuple>("alias", alias, 0);

		std::vector<Poco::AutoPtr<Group>> resultVector;
		resultVector.reserve(group_list.size());
		for (auto it = group_list.begin(); it != group_list.end(); it++) {
			resultVector.push_back(new Group(new model::table::Group(*it)));
		}
		return resultVector;
	}
	
	std::vector<Poco::AutoPtr<Group>> Group::listAll()
	{
		auto db = new model::table::Group();
		std::vector<model::table::GroupTuple> group_list;
		// throw an unresolved external symbol error
		//group_list = db->loadAllFromDB<model::table::GroupTuple>();
		
		// work around for not working call to loadAllFromDB
		auto cm = ConnectionManager::getInstance();
		Poco::Data::Statement select(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

		select << "SELECT id, alias, name, url, description FROM " << db->getTableName()
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

