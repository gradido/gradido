#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE

#define EMAIL_VERIFICATION_CODE_SIZE 8

#include "ModelBase.h"
#include "Poco/Types.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {

		enum EmailOptInType {
			EMAIL_OPT_IN_EMPTY = 0,
			EMAIL_OPT_IN_REGISTER = 1,
			EMAIL_OPT_IN_RESET_PASSWORD = 2
		};

		typedef Poco::Tuple<int, int, Poco::UInt64, int> EmailOptInTuple;

		class EmailOptIn : public ModelBase
		{
		public:
			EmailOptIn(const Poco::UInt64& code, int user_id, EmailOptInType type);
			EmailOptIn(const Poco::UInt64& code, EmailOptInType type);
			EmailOptIn(const EmailOptInTuple& tuple);
			EmailOptIn();
			~EmailOptIn();

			// generic db operations
			const char* getTableName() { return "email_opt_in"; }
			std::string toString();
			
			inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
			inline int getUserId() const { return mUserId; }
			inline EmailOptInType getType() const { return static_cast<EmailOptInType>(mType);}
			inline void setCode(Poco::UInt64 code) { mEmailVerificationCode = code; }
			inline void setUserId(int user_Id) { mUserId = user_Id; }

			static const char* typeToString(EmailOptInType type);
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int			 mUserId;
			// data type must be a multiple of 4
			Poco::UInt64 mEmailVerificationCode;
			int			 mType;
			
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE