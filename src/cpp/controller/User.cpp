#include "User.h"

namespace controller {
	User::User(model::table::User* dbModel)
	{
		mDBModel = dbModel;
	}

	User::~User()
	{

	}


	Poco::AutoPtr<User> User::create()
	{
		/*auto code = createEmailVerificationCode();
		auto db = new model::table::EmailOptIn(code, user_id);
		auto result = new EmailVerificationCode(db);
		return Poco::AutoPtr<EmailVerificationCode>(result);
		*/

	}
}