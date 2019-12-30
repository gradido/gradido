#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE

#include "../model/table/User.h"

#include "TableControllerBase.h"

namespace controller {
	class User : public TableControllerBase
	{
	public:

		~User();

		static Poco::AutoPtr<User> create();

		inline Poco::AutoPtr<model::table::User> getModel() { return _getModel<model::table::User>(); }

	protected:
		User(model::table::User* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE