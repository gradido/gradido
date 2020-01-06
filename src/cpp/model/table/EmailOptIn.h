#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE

#define EMAIL_VERIFICATION_CODE_SIZE 8

#include "ModelBase.h"
#include "Poco/Types.h"

namespace model {
	namespace table {

		enum EmailOptInType {
			EMAIL_OPT_IN_REGISTER = 1,
			EMAIL_OPT_IN_RESET_PASSWORD = 2
		};

		class EmailOptIn : public ModelBase
		{
		public:
			EmailOptIn(const Poco::UInt64& code, int user_id, EmailOptInType type);
			EmailOptIn(const Poco::UInt64& code, EmailOptInType type);
			EmailOptIn();
			~EmailOptIn();

			// generic db operations
			const char* getTableName() { return "email_opt_in"; }
			std::string toString();
			
			inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
			inline void setCode(Poco::UInt64 code) { mEmailVerificationCode = code; }

			static const char* typeToString(EmailOptInType type);
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			// data type must be a multiple of 4
			Poco::UInt64 mEmailVerificationCode;
			int			 mUserId;
			EmailOptInType mType;
			
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE