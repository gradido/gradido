#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE

#include "../model/table/NodeServer.h"
#include "../controller/HederaId.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {

	struct NodeServerConnection
	{
		NodeServerConnection(const std::string& _url, int _port) : url(_url), port(_port) {}
		NodeServerConnection() :port(0) {};

		std::string getUrlWithPort() const { return url + ":" + std::to_string(port); }

		bool isValid() { return url != "" && port; }
		std::string url;
		int port;

		Poco::AutoPtr<controller::HederaId> hederaId;
	};

	typedef Poco::Tuple<int, std::string, int, int, int, int, Poco::UInt64, Poco::UInt64, Poco::UInt64, Poco::DateTime> NodeServerFullTuple;

	class NodeServer : public TableControllerBase
	{
	public:

		~NodeServer();

		static Poco::AutoPtr<NodeServer> create(const std::string& url, int port, int groupId, model::table::NodeServerType type, int nodeHederaId);

		static std::vector<Poco::AutoPtr<NodeServer>> load(model::table::NodeServerType type, int group_id = 0);		
		static std::vector<Poco::AutoPtr<NodeServer>> listAll();
		// pick server randomly
		static NodeServerConnection pick(model::table::NodeServerType type, int group_id = 0);
		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::NodeServer> getModel() { return _getModel<model::table::NodeServer>(); }

		inline void setHederaId(Poco::AutoPtr<controller::HederaId> hederaId) { mHederaID = hederaId; }
		inline Poco::AutoPtr<controller::HederaId> getHederaId() { return mHederaID; }
	protected:
		NodeServer(model::table::NodeServer* dbModel);
		Poco::AutoPtr<controller::HederaId> mHederaID;

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE