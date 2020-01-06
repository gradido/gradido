#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE

#include "../model/table/EmailOptIn.h"

#include "TableControllerBase.h"

namespace controller {
	class EmailVerificationCode : public TableControllerBase
	{
	public:
		
		~EmailVerificationCode();

		static Poco::AutoPtr<EmailVerificationCode> create(int user_id, model::table::EmailOptInType type = model::table::EMAIL_OPT_IN_REGISTER);
		static Poco::AutoPtr<EmailVerificationCode> create(model::table::EmailOptInType type = model::table::EMAIL_OPT_IN_REGISTER);
		inline size_t load(Poco::UInt64 code) { return getModel()->loadFromDB("verification_code", code); }
		inline size_t load(int user_id, model::table::EmailOptInType type) {
			std::vector<std::string> fields = { "user_id", "email_opt_in_type_id"};
			return getModel()->loadFromDB(fields, user_id, (int)type);
		}
		inline Poco::AutoPtr<model::table::EmailOptIn> getModel() { return _getModel<model::table::EmailOptIn>(); }

		std::string getLink();

	protected:
		EmailVerificationCode(model::table::EmailOptIn* dbModel);
		static Poco::UInt64 createEmailVerificationCode();

		//table::EmailOptIn* mDBModel;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE