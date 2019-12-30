#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE

#include "table/EmailOptIn.h"

#include "TableControllerBase.h"

namespace model {
	class EmailVerificationCode : public TableControllerBase
	{
	public:
		
		~EmailVerificationCode();

		static Poco::AutoPtr<EmailVerificationCode> create(int user_id);
		inline Poco::AutoPtr<table::EmailOptIn> getModel() { return _getModel<table::EmailOptIn>(); }

	protected:
		EmailVerificationCode(table::EmailOptIn* dbModel);
		static Poco::UInt64 createEmailVerificationCode();

		//table::EmailOptIn* mDBModel;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE