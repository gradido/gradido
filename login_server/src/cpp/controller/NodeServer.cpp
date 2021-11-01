#include "NodeServer.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/CronManager.h"
#include "Poco/RegularExpression.h"

namespace controller {

	Poco::RegularExpression g_filterHttp("^https?://");

	std::string NodeServerConnection::getUriWithPort() const
	{
		std::string protocol;
		g_filterHttp.extract(url, protocol);
		return url.substr(protocol.size()) + ":" + std::to_string(port);
	}

	std::string NodeServerConnection::getUri() const
	{
		std::string protocol;
		g_filterHttp.extract(url, protocol);
		return url.substr(protocol.size());
	}




	NodeServer::NodeServer(model::table::NodeServer* dbModel) 
	{
		mDBModel = dbModel;
		if (model::table::NODE_SERVER_GRADIDO_COMMUNITY == dbModel->getNodeServerType()) {
			CronManager::getInstance()->addNodeServerToPing(Poco::AutoPtr<controller::NodeServer>(this, true));
		}
	}

	NodeServer::~NodeServer()
	{

	}

	bool NodeServer::deleteFromDB() 
	{ 
		auto result = mDBModel->deleteFromDB(); 
		if (result && model::table::NODE_SERVER_GRADIDO_COMMUNITY == getModel()->getNodeServerType()) {
			CronManager::getInstance()->removeNodeServerToPing(Poco::AutoPtr<controller::NodeServer>(this, true));
		}
		return result;
	}

	Poco::AutoPtr<NodeServer> NodeServer::create(const std::string& url, int port, int groupId, model::table::NodeServerType type)
	{
		auto db = new model::table::NodeServer(url, port, groupId, type);
		auto group = new NodeServer(db);
		return Poco::AutoPtr<NodeServer>(group);
	}

	Poco::AutoPtr<NodeServer> NodeServer::load(int id)
	{
		auto db = new model::table::NodeServer();
		if (1 == db->loadFromDB("id", id)) {
			return new NodeServer(db);
		}
		return nullptr;
	}

	std::vector<Poco::AutoPtr<NodeServer>> NodeServer::load(model::table::NodeServerType type, int group_id/* = 0*/)
	{
		auto db = new model::table::NodeServer();
		std::vector<model::table::NodeServerTuple> node_server_list;
		
		if (type == model::table::NODE_SERVER_GRADIDO_NODE || type == model::table::NODE_SERVER_GRADIDO_COMMUNITY) 
		{
			if (group_id) 
			{
				node_server_list = db->loadFromDB<int, model::table::NodeServerTuple>(
					{ "server_type", "group_id" },
					{ type, group_id },
					model::table::MYSQL_CONDITION_AND
				);
			}
			else 
			{
				node_server_list = db->loadFromDB<int, model::table::NodeServerTuple >("server_type", type, 4);
			}
		}
		//auto node_server_list = db->loadFromDB<std::string, model::table::NodeServerTuple>("alias", alias, 0);

		std::vector<Poco::AutoPtr<NodeServer>> resultVector;
		resultVector.reserve(node_server_list.size());
		for (auto it = node_server_list.begin(); it != node_server_list.end(); it++) {
			resultVector.push_back(new NodeServer(new model::table::NodeServer(*it)));
		}
		return resultVector;
	}

	/*
	SELECT * FROM table_name
	ORDER BY RAND()
	LIMIT 1;
	*/
	
	NodeServerConnection NodeServer::pick(model::table::NodeServerType type, int group_id/* = 0*/)
	{
		auto cm = ConnectionManager::getInstance();
		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		NodeServerConnection result;
		int hedera_node_id = 0;

		Poco::Data::Statement select(session);
		select << "SELECT url, port";

		select << " from node_servers where server_type = ? ORDER BY RAND() LIMIT 1"
			  , Poco::Data::Keywords::into(result.url)
			  , Poco::Data::Keywords::into(result.port);

		select , Poco::Data::Keywords::bind((int)type);
		try {
			if (1 == select.execute()) {
				return result;
			}
		}
		catch (Poco::Exception& ex) {
			auto em = ErrorManager::getInstance();
			const char* functionName = "NodeServer::pick";
			em->addError(new ParamError(functionName, "mysql error by pick: ", ex.message()));
			em->addError(new ParamError(functionName, "server type: ", model::table::NodeServer::nodeServerTypeToString(type)));
			em->addError(new ParamError(functionName, "group id", group_id));
			em->sendErrorsAsEmail();
		}
		return result;

	}

	std::vector<Poco::AutoPtr<NodeServer>> NodeServer::listAll()
	{
		Poco::AutoPtr<model::table::NodeServer> nodeServerModel(new model::table::NodeServer);
		auto rows = nodeServerModel->loadAllFromDB<model::table::NodeServerTuple>();
		
		std::vector<Poco::AutoPtr<NodeServer>> results;
		for (auto it = rows.begin(); it != rows.end(); it++) {
			//NodeServer(const std::string& url, int port, int groupId, NodeServerType type);
			auto row = *it;
			model::table::NodeServer* db = new model::table::NodeServer(row);
			Poco::AutoPtr<NodeServer> node_server(new NodeServer(db));
			results.push_back(node_server);
		}
		return results;		
	}

	JsonRequest NodeServer::createJsonRequest()
	{
		auto model = getModel();
		NodeServerConnection connection(model->getUrl(), model->getPort());
		return JsonRequest(connection.getUri(), model->getPort());
	}

	std::string NodeServer::getBaseUri()
	{
		auto model = getModel();
		NodeServerConnection connection(model->getUrl(), model->getPort());
		return connection.getUri();
	}

}