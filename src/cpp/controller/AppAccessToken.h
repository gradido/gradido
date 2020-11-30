#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_APP_ACCESS_TOKEN_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_APP_ACCESS_TOKEN_INCLUDE

#include "../model/table/AppAccessToken.h"

#include "TableControllerBase.h"

namespace controller {
	class AppAccessToken : public TableControllerBase
	{
	public:

		~AppAccessToken();

		static Poco::AutoPtr<AppAccessToken> create(int user_id);

		static Poco::AutoPtr<AppAccessToken> load(const Poco::UInt64& code);
		static std::vector<Poco::AutoPtr<AppAccessToken>>   load(int user_id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::AppAccessToken> getModel() { return _getModel<model::table::AppAccessToken>(); }

		inline Poco::Timespan getAge() { return Poco::DateTime() - getModel()->getCreated(); }

	protected:
		AppAccessToken(model::table::AppAccessToken* dbModel);
		static Poco::UInt64 createAppAccessCode();

		//table::EmailOptIn* mDBModel;
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_APP_ACCESS_TOKEN_INCLUDE