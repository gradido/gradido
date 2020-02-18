#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE

#include "../model/table/UserBackups.h"

#include "TableControllerBase.h"

namespace controller {
	class UserBackups : public TableControllerBase
	{
	public:

		~UserBackups();

		static Poco::AutoPtr<UserBackups> create(int user_id, const std::string& passphrase);

		static std::vector<Poco::AutoPtr<UserBackups>> load(int user_id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::UserBackups> getModel() { return _getModel<model::table::UserBackups>(); }


	protected:
		UserBackups(model::table::UserBackups* dbModel);

		
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_USER_BACKUPS_INCLUDE