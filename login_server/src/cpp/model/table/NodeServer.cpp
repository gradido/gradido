
#include "NodeServer.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		bool NodeServerHasGroup(NodeServerType type) {
			return type == NODE_SERVER_GRADIDO_NODE || type == NODE_SERVER_GRADIDO_COMMUNITY;
		}

	
		NodeServer::NodeServer()
			: mPort(0), mGroupId(0), mServerType(0)
		{

		}

		NodeServer::NodeServer(const std::string& url, int port, int groupId, NodeServerType type)
			: mUrl(url), mPort(port), mGroupId(groupId), mServerType(type)
		{
		}

		
		
		NodeServer::NodeServer(const NodeServerTuple& tuple)
			: ModelBase(tuple.get<0>()),
			mUrl(tuple.get<1>()), mPort(tuple.get<2>()), mGroupId(tuple.get<3>()), 
			mServerType(tuple.get<4>()), mLastLiveSign(tuple.get<5>())
		{

		}

		NodeServer::~NodeServer()
		{

		}

		std::string NodeServer::toString()
		{
			std::stringstream ss;

			ss << "id: " << getID() << std::endl;
			ss << mUrl << ":" << mPort << std::endl;
			ss << "group id: " << mGroupId << std::endl;
			ss << "server type: " << nodeServerTypeToString((NodeServerType)mServerType) << std::endl;
			ss << "last live sign: " << Poco::DateTimeFormatter::format(mLastLiveSign, "%f.%m.%Y %H:%M:%S") << std::endl;

			return ss.str();
		}

		const char* NodeServer::nodeServerTypeToString(NodeServerType type)
		{
			switch (type) {
			case NODE_SERVER_NONE: return "none";
			case NODE_SERVER_GRADIDO_NODE: return "Gradido Node";
			case NODE_SERVER_GRADIDO_COMMUNITY: return "Gradido Community";
			default: return "<unknown>";
			}
		}

		Poco::Data::Statement NodeServer::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, url, port, group_id, server_type, last_live_sign FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUrl), into(mPort), into(mGroupId), into(mServerType), into(mLastLiveSign);

			return select;
		}

		Poco::Data::Statement NodeServer::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);
			// 		typedef Poco::Tuple<std::string, std::string, std::string, Poco::Nullable<Poco::Data::BLOB>, int> UserTuple;
			select << "SELECT id, url, port, group_id, server_type, last_live_sign FROM " << getTableName()
				<< " where " << fieldName << " LIKE ?";

			return select;
		}
		Poco::Data::Statement NodeServer::_loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			select << "SELECT id, url, port, group_id, server_type, last_live_sign FROM " << getTableName()
				<< " where " << fieldNames[0] << " = ? ";
			if (conditionType == MYSQL_CONDITION_AND) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " AND " << fieldNames[i] << " = ?";
				}
			}
			else if (conditionType == MYSQL_CONDITION_OR) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " OR " << fieldNames[i] << " = ?";
				}
			}
			return select;
		}

		Poco::Data::Statement NodeServer::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			
			select << "SELECT id FROM " << getTableName()
				<< " where url = ? AND port = ? "
				, into(mID), use(mUrl), use(mPort);

			return select;
		}

		Poco::Data::Statement NodeServer::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			insert << "INSERT INTO " << getTableName()
				<< " (url, port, group_id, server_type) VALUES(?,?,?,?)"
				, use(mUrl), use(mPort), use(mGroupId), use(mServerType);
			
			return insert;
		}

		Poco::Data::Statement NodeServer::_loadAllFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, url, port, group_id, server_type, last_live_sign FROM " << getTableName();

			return select;
		}

	}
}