#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE

#include "../model/table/NodeServer.h"
#include "../lib/JsonRequest.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {

	struct NodeServerConnection
	{
		NodeServerConnection(const std::string& _url, int _port) : url(_url), port(_port) {}
		NodeServerConnection() :port(0) {};

		// with http:// or https://
		inline std::string getUrlWithPort() const { return url + ":" + std::to_string(port); }

		// without http:// or https://
		std::string getUriWithPort() const;
		std::string getUri() const;

		bool isValid() { return url != "" && port; }
		std::string url;
		int port;

	};


	class NodeServer : public TableControllerBase
	{
	public:
		~NodeServer();

		static Poco::AutoPtr<NodeServer> create(const std::string& url, int port, int groupId, model::table::NodeServerType type);

		//! \param group_id is zero take everyone
		static std::vector<Poco::AutoPtr<NodeServer>> load(model::table::NodeServerType type, int group_id = 0);		
		static Poco::AutoPtr<NodeServer> load(int id);
		static std::vector<Poco::AutoPtr<NodeServer>> listAll();
		// pick server randomly
		static NodeServerConnection pick(model::table::NodeServerType type, int group_id = 0);
		bool deleteFromDB();

		inline Poco::AutoPtr<model::table::NodeServer> getModel() { return _getModel<model::table::NodeServer>(); }

		std::string getBaseUri();
		JsonRequest createJsonRequest();
	protected:
		NodeServer(model::table::NodeServer* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_NODE_SERVER_INCLUDE