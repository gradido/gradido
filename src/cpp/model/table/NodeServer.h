#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE

#include "ModelBase.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, std::string, int, int, int, int, Poco::DateTime> NodeServerTuple;

		enum NodeServerType {
			NODE_SERVER_NONE,
			NODE_SERVER_GRADIDO_NODE,
			NODE_SERVER_GRADIDO_COMMUNITY,
			NODE_SERVER_HEDERA_MAINNET_NODE,
			NODE_SERVER_HEDERA_TESTNET_NODE,
			NODE_SERVER_TYPE_COUNT
		};
		bool NodeServerIsHederaNode(NodeServerType type);
		bool NodeServerHasGroup(NodeServerType type);


		class NodeServer : public ModelBase
		{
		public:
			NodeServer();
			NodeServer(const std::string& url, int port, int groupId, NodeServerType type, int nodeHederaId);
			NodeServer(const NodeServerTuple& tuple);
			~NodeServer();

			// generic db operations
			const char* getTableName() const { return "node_servers"; }
			std::string toString();

			static const char* nodeServerTypeToString(NodeServerType type);

			inline void setLastLiveSign(Poco::DateTime lastLiveSign) { std::unique_lock<std::shared_mutex> _lock(mSharedMutex); mLastLiveSign = lastLiveSign; }

			inline std::string getUrl() const { return mUrl; }
			inline int getPort() const { return mPort; }
			inline std::string getUrlWithPort() const { return mUrl + ":" + std::to_string(mPort); }
			inline int getGroupId() const { return mGroupId; }
			inline NodeServerType getNodeServerType() const { return (NodeServerType)mServerType; }
			inline bool isHederaNode() const { return NodeServerIsHederaNode((NodeServerType)mServerType);}
			inline bool hasGroup() const {return NodeServerHasGroup((NodeServerType)mServerType);}
			inline int getNodeHederaId() const { return mNodeHederaId; }
			inline Poco::DateTime getLastLiveSign() const { std::shared_lock<std::shared_mutex> _lock(mSharedMutex); return mLastLiveSign; }

		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			std::string mUrl;
			int			mPort;
			int			mGroupId;
			int			mServerType;
			int			mNodeHederaId;
			Poco::DateTime mLastLiveSign;

			mutable std::shared_mutex mSharedMutex;
			
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_NODE_SERVER_INCLUDE