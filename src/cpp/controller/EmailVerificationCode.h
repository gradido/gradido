#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE

#include "../model/table/EmailOptIn.h"

#include "TableControllerBase.h"

namespace controller {
	class EmailVerificationCode : public TableControllerBase
	{
	public:
		
		~EmailVerificationCode();

		static Poco::AutoPtr<EmailVerificationCode> create(int user_id);
		inline Poco::AutoPtr<model::table::EmailOptIn> getModel() { return _getModel<model::table::EmailOptIn>(); }

	protected:
		EmailVerificationCode(model::table::EmailOptIn* dbModel);
		static Poco::UInt64 createEmailVerificationCode();

		//table::EmailOptIn* mDBModel;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE