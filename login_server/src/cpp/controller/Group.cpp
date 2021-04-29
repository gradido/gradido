
#include "Group.h"

#include "Poco/URI.h"

namespace controller {

	Group::Group(model::table::Group* dbModel)
	{
		mDBModel = dbModel;
	}

	Group::~Group()
	{

	}

	Poco::AutoPtr<Group> Group::create(const std::string& alias, const std::string& name, const std::string& url, const std::string& host, const std::string& home, const std::string& description)
	{
		auto db = new model::table::Group(alias, name, url, host, home, description);
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
		
		group_list = db->loadAllFromDB<model::table::GroupTuple>();
		
		std::vector<Poco::AutoPtr<Group>> resultVector;
		
		resultVector.reserve(group_list.size());
		for (auto it = group_list.begin(); it != group_list.end(); it++) {
			Poco::AutoPtr<Group> group_ptr(new Group(new model::table::Group(*it)));
			resultVector.push_back(group_ptr);
		}
		return resultVector;
	}

	JsonRequest Group::createJsonRequest()
	{
		int port = 0;
		port = ServerConfig::g_serverPort;
		if (!port) {
			if (ServerConfig::SERVER_TYPE_PRODUCTION == ServerConfig::g_ServerSetupType ||
				ServerConfig::SERVER_TYPE_STAGING == ServerConfig::g_ServerSetupType) {
				port = 443;
			}
			else {
				port = 80;
			}
		}
		auto model = getModel();
		std::string request_url = model->getHost();
		if ("" == request_url) {
			request_url = model->getUrl();
		}
		return JsonRequest(request_url, port);
	}
	
	std::string Group::getHost()
	{
		auto model = getModel();
		auto url = model->getUrl();
		if (url.find("http") != url.npos) {
			auto uri = Poco::URI(url);
			return uri.getHost();
		}
		return url;
	}
}

