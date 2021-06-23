#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_GROUP_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_GROUP_INCLUDE

#include "../model/table/Group.h"

#include "../lib/JsonRequest.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class Group : public TableControllerBase
	{
	public:

		~Group();

		static Poco::AutoPtr<Group> create(const std::string& alias, const std::string& name, const std::string& url, const std::string& host, const std::string& home, const std::string& description);

		static std::vector<Poco::AutoPtr<Group>> load(const std::string& alias);
		static Poco::AutoPtr<Group> load(int id);
		static std::vector<Poco::AutoPtr<Group>> listAll();

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::Group> getModel() { return _getModel<model::table::Group>(); }
		JsonRequest createJsonRequest();

		std::string getHost();
	
	protected:
		Group(model::table::Group* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_GROUP_INCLUDE