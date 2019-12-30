#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE

#define EMAIL_VERIFICATION_CODE_SIZE 8

#include "ModelBase.h"
#include "Poco/Types.h"

namespace model {
	namespace table {
		class EmailOptIn : public ModelBase
		{
		public:
			EmailOptIn(const Poco::UInt64& code, int user_id);
			EmailOptIn();
			~EmailOptIn();

			// generic db operations
			const char* getTableName() { return "email_opt_in"; }
			Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
			Poco::Data::Statement updateIntoDB(Poco::Data::Session session);
			Poco::Data::Statement loadFromDB(Poco::Data::Session session, std::string& fieldName);


			inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
		protected:
			

			// data type must be a multiple of 4
			Poco::UInt64 mEmailVerificationCode;
			int			 mUserId;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE