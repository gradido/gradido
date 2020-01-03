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
			EmailOptIn(const Poco::UInt64& code);
			EmailOptIn();
			~EmailOptIn();

			// generic db operations
			const char* getTableName() { return "email_opt_in"; }
			
			inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
			inline void setCode(Poco::UInt64 code) { mEmailVerificationCode = code; }
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			// data type must be a multiple of 4
			Poco::UInt64 mEmailVerificationCode;
			int			 mUserId;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE