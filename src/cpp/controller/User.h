#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE

#include "../model/table/User.h"


#include "TableControllerBase.h"

namespace controller {

	/*enum UserLoadedRole {
		USER_ROLE_NOT_LOADED,
		USER_ROLE_CURRENTLY_LOADING,
		USER_ROLE_NONE,
		USER_ROLE_ADMIN
	};*/

	class User : public TableControllerBase
	{
	public:

		~User();

		static Poco::AutoPtr<User> create();
		static Poco::AutoPtr<User> create(const std::string& email, const std::string& first_name, const std::string& last_name, Poco::UInt64 passwordHashed = 0, std::string languageKey = "de");

		static std::vector<User*> search(const std::string& searchString);

		inline size_t load(const std::string& email) { return getModel()->loadFromDB("email", email); }
		inline size_t load(int user_id) { return getModel()->loadFromDB("id", user_id); }
		int load(const unsigned char* pubkey_array);
		Poco::JSON::Object getJson();

		inline Poco::AutoPtr<model::table::User> getModel() { return _getModel<model::table::User>(); }
		inline const model::table::User* getModel() const { return _getModel<model::table::User>(); }



		const std::string& getPublicHex();
		

	protected:
		User(model::table::User* dbModel);
		
		std::string mPublicHex;


	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_INCLUDE