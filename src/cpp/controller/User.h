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
		static Poco::AutoPtr<User> create(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed = 0, std::string languageKey = "de");

		inline int load(const std::string& email) { return getModel()->loadFromDB("email", email); }
		inline int load(int user_id) { return getModel()->loadFromDB("id", user_id); }
		int load(const unsigned char* pubkey_array);

		inline Poco::AutoPtr<model::table::User> getModel() { return _getModel<model::table::User>(); }

	protected:
		User(model::table::User* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE