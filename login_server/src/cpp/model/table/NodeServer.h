#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE

#include "ModelBase.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, std::string, int, int, int, Poco::DateTime> NodeServerTuple;

		enum NodeServerType {
			NODE_SERVER_NONE,
			NODE_SERVER_GRADIDO_NODE,
			NODE_SERVER_GRADIDO_COMMUNITY,
			NODE_SERVER_TYPE_COUNT,
			NODE_SERVER_TYPE_NONE
		};
		bool NodeServerHasGroup(NodeServerType type);


		class NodeServer : public ModelBase
		{
		public:
			NodeServer();
			NodeServer(const std::string& url, int port, int groupId, NodeServerType type);
			NodeServer(const NodeServerTuple& tuple);
			~NodeServer();

			// generic db operations
			const char* getTableName() const { return "node_servers"; }
			std::string toString();

			static const char* nodeServerTypeToString(NodeServerType type);

			inline void setLastLiveSign(Poco::DateTime lastLiveSign) { UNIQUE_LOCK; mLastLiveSign = lastLiveSign; }

			// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			// !ATTENTION! if using set port or set url review CronManager code
			// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

			inline std::string getUrl() const { return mUrl; }
			inline int getPort() const { return mPort; }
			inline std::string getUrlWithPort() const { return mUrl + ":" + std::to_string(mPort); }
			inline int getGroupId() const { return mGroupId; }
			inline NodeServerType getNodeServerType() const { return (NodeServerType)mServerType; }
			inline bool hasGroup() const {return NodeServerHasGroup((NodeServerType)mServerType);}
			inline Poco::DateTime getLastLiveSign() const { SHARED_LOCK; return mLastLiveSign; }

		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadAllFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			std::string mUrl;
			int			mPort;
			int			mGroupId;
			int			mServerType;
			Poco::DateTime mLastLiveSign;
			
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE