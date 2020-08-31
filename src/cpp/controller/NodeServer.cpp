#include "NodeServer.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/ConnectionManager.h"

namespace controller {


	NodeServer::NodeServer(model::table::NodeServer* dbModel) 
	{
		mDBModel = dbModel;
	}

	NodeServer::~NodeServer()
	{

	}

	Poco::AutoPtr<NodeServer> NodeServer::create(const std::string& url, int port, int groupId, model::table::NodeServerType type, int nodeHederaId)
	{
		auto db = new model::table::NodeServer(url, port, groupId, type, nodeHederaId);
		auto group = new NodeServer(db);
		return Poco::AutoPtr<NodeServer>(group);
	}

	std::vector<Poco::AutoPtr<NodeServer>> NodeServer::load(model::table::NodeServerType type, int group_id/* = 0*/)
	{
		auto db = new model::table::NodeServer();
		std::vector<model::table::NodeServerTuple> node_server_list;
		
		if (type == model::table::NODE_SERVER_HEDERA_MAINNET_NODE || type == model::table::NODE_SERVER_HEDERA_TESTNET_NODE) 
		{
			node_server_list = db->loadFromDB<model::table::NodeServerType, model::table::NodeServerTuple>("server_type", type, 4);
		}
		else if (type == model::table::NODE_SERVER_GRADIDO_NODE) 
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

		if (model::table::NodeServerIsHederaNode(type)) {
			select << ", node_hedera_id";
		}
		select << " from node_servers ORDER BY RAND() LIMIT 1"
			  , Poco::Data::Keywords::into(result.url)
			  , Poco::Data::Keywords::into(result.port);
		if (model::table::NodeServerIsHederaNode(type)) {
			select, Poco::Data::Keywords::into(hedera_node_id);
		}
		try {
			if (1 == select.execute()) {
				if (model::table::NodeServerIsHederaNode(type)) {
					result.hederaId = controller::HederaId::load(hedera_node_id);
				}
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
		auto cm = ConnectionManager::getInstance();
		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);
		std::vector<NodeServerFullTuple> rows;
		// typedef Poco::Tuple<int, std::string, int, int, int, int, Poco::UInt64, Poco::UInt64, Poco::UInt64, Poco::DateTime> NodeServerFullTuple;
		select << "SELECT n.id, n.url, n.port, n.group_id, n.server_type, n.node_hedera_id, h.shardNum, h.realmNum, h.num, n.last_live_sign "
			<< "FROM node_servers as n "
			<< "LEFT JOIN hedera_ids as h ON h.id = n.node_hedera_id"
			, Poco::Data::Keywords::into(rows);

		try {
			select.executeAsync();
			select.wait();
		}
		catch (Poco::Exception& ex) {
			auto em = ErrorManager::getInstance();
			const char* functionName = "NodeServer::listAll";
			em->addError(new ParamError(functionName, "mysql error by list all: ", ex.message()));
			em->sendErrorsAsEmail();
		}
		std::vector<Poco::AutoPtr<NodeServer>> results;
		for (auto it = rows.begin(); it != rows.end(); it++) {
			//NodeServer(const std::string& url, int port, int groupId, NodeServerType type, int nodeHederaId);
			auto row = *it;
			model::table::NodeServer* db = new model::table::NodeServer(
				row.get<1>(), row.get<2>(), row.get<3>(), (model::table::NodeServerType)row.get<4>(), row.get<5>()
			);
			db->setLastLiveSign(row.get<9>());
			db->setID(row.get<0>());
			Poco::AutoPtr<NodeServer> node_server(new NodeServer(db));
			node_server->setHederaId(controller::HederaId::create(
				row.get<6>(), row.get<7>(), row.get<8>()
			));
			results.push_back(node_server);

		}
		return results;
		
	}

}