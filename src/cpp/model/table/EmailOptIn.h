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
			
			inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, std::string& fieldName);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			// data type must be a multiple of 4
			Poco::UInt64 mEmailVerificationCode;
			int			 mUserId;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE