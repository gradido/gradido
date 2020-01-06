#include "EmailOptIn.h"

#include "sodium.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		EmailOptIn::EmailOptIn(const Poco::UInt64& code, int user_id, EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
			: mUserId(user_id), mEmailVerificationCode(code), mType(type)
		{
			
		}

		EmailOptIn::EmailOptIn(const Poco::UInt64& code, EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
			: mUserId(0), mEmailVerificationCode(code), mType(type)
		{

		}

		EmailOptIn::EmailOptIn()
			: mUserId(0), mEmailVerificationCode(0)
		{

		}

		EmailOptIn::~EmailOptIn()
		{

		}


		Poco::Data::Statement EmailOptIn::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (user_id, verification_code, email_opt_in_type_id) VALUES(?,?,?))"
				, bind(mUserId), bind(mEmailVerificationCode), bind(mType);
			unlock();
			return insert;
		}


		Poco::Data::Statement EmailOptIn::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			int iType = 0;
			select << "SELECT user_id, verification_code, email_opt_in_type_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mUserId), into(mEmailVerificationCode), into(iType);

			mType = static_cast<EmailOptInType>(iType);

			return select;
		}

		std::string EmailOptIn::toString()
		{
			std::stringstream ss;
			ss << "code: " << mEmailVerificationCode << std::endl;
			ss << "user_id: " << mUserId << std::endl;
			ss << "type: " << typeToString(mType) << std::endl;
			return ss.str();
		}

		const char* EmailOptIn::typeToString(EmailOptInType type)
		{
			switch (type) {
			case EMAIL_OPT_IN_REGISTER: return "register";
			case EMAIL_OPT_IN_RESET_PASSWORD: return "resetPassword";
			default: return "<unknown>";
			}
		}
	}
}


