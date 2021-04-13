#include "EmailOptIn.h"

#include "sodium.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {
		EmailOptIn::EmailOptIn(const Poco::UInt64& code, int user_id, EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
			: mUserId(user_id), mEmailVerificationCode(code), mType(type), mResendCount(0)
		{
			
		}

		EmailOptIn::EmailOptIn(const Poco::UInt64& code, EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
			: mUserId(0), mEmailVerificationCode(code), mType(type), mResendCount(0)
		{

		}

		EmailOptIn::EmailOptIn()
			: mUserId(0), mEmailVerificationCode(0), mResendCount(0)
		{

		}

		EmailOptIn::EmailOptIn(const EmailOptInTuple& tuple)
			: ModelBase(tuple.get<0>()), 
			mUserId(tuple.get<1>()), mEmailVerificationCode(tuple.get<2>()), mType(tuple.get<3>()), 
			mCreated(tuple.get<4>()), mResendCount(tuple.get<5>()), mUpdated(tuple.get<6>())
		{

		}
		
		EmailOptIn::~EmailOptIn()
		{

		}


		Poco::Data::Statement EmailOptIn::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock("EmailOptIn::_insertIntoDB");
			assert(mUserId > 0);
			assert(mEmailVerificationCode > 0);

			insert << "INSERT INTO " << getTableName()
				<< " (user_id, verification_code, email_opt_in_type_id, resend_count) VALUES(?,?,?,?)"
				, use(mUserId), use(mEmailVerificationCode), bind(mType), bind(mResendCount);
			unlock();
			mUpdated = Poco::DateTime();
			mCreated = Poco::DateTime();
			return insert;
		}


		Poco::Data::Statement EmailOptIn::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, verification_code, email_opt_in_type_id, created, resend_count, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mEmailVerificationCode), into(mType), into(mCreated), into(mResendCount), into(mUpdated);


			return select;
		}

		Poco::Data::Statement EmailOptIn::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where verification_code = ?"
				, into(mID), use(mEmailVerificationCode);

			return select;
		}

		Poco::Data::Statement EmailOptIn::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, verification_code, email_opt_in_type_id, created, resend_count, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?";


			return select;
		}

		Poco::Data::Statement EmailOptIn::_loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("EmailOptIn::_loadFromDB fieldNames empty or contain only one field");
			}

			select << "SELECT id, user_id, verification_code, email_opt_in_type_id, created, resend_count, updated FROM " << getTableName()
				<< " where " << fieldNames[0] << " = ? ";
			if (conditionType == MYSQL_CONDITION_AND) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " AND " << fieldNames[i] << " = ? ";
				}
			}
			else if (conditionType == MYSQL_CONDITION_OR) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " OR " << fieldNames[i] << " = ? ";
				}
			}
			else {
				addError(new ParamError("EmailOptIn::_loadFromDB", "condition type not implemented", conditionType));
			}

			return select;
		}


		Poco::Data::Statement EmailOptIn::_loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("EmailOptIn::_loadFromDB fieldNames empty or contain only one field");
			}

			select << "SELECT id, user_id, verification_code, email_opt_in_type_id, created, resend_count, updated FROM " << getTableName()
				<< " where " << fieldNames[0] << " = ? ";
			if (conditionType == MYSQL_CONDITION_AND) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " AND " << fieldNames[i] << " = ? ";
				}
			}
			else if (conditionType == MYSQL_CONDITION_OR) {
				for (int i = 1; i < fieldNames.size(); i++) {
					select << " OR " << fieldNames[i] << " = ? ";
				}
			}
			else {
				addError(new ParamError("EmailOptIn::_loadFromDB", "condition type not implemented", conditionType));
			}
				//<< " where " << fieldName << " = ?"
			select , into(mID), into(mUserId), into(mEmailVerificationCode), into(mType), into(mCreated), into(mResendCount), into(mUpdated);


			return select;
		}

		size_t EmailOptIn::addResendCountAndUpdate()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			mResendCount++;
			mUpdated = Poco::DateTime();
			return updateIntoDB("resend_count", mResendCount);
		}

		std::string EmailOptIn::toString()
		{
			std::stringstream ss;
			ss << "code: " << mEmailVerificationCode << std::endl;
			ss << "user_id: " << mUserId << std::endl;
			ss << "type: " << typeToString(static_cast<EmailOptInType>(mType)) << std::endl;
			return ss.str();
		}

		const char* EmailOptIn::typeToString(EmailOptInType type)
		{
			switch (type) {
			case EMAIL_OPT_IN_REGISTER: return "register";
			case EMAIL_OPT_IN_RESET_PASSWORD: return "resetPassword";
			case EMAIL_OPT_IN_REGISTER_DIRECT: return "registerDirect";
			default: return "<unknown>";
			}
		}
		EmailOptInType EmailOptIn::stringToType(const std::string& typeString)
		{
			if (typeString == "register") {
				return EMAIL_OPT_IN_REGISTER;
			}
			else if (typeString == "resetPassword") {
				return EMAIL_OPT_IN_RESET_PASSWORD;
			}
			else if (typeString == "registerDirect") {
				return EMAIL_OPT_IN_REGISTER_DIRECT;
			}
			return EMAIL_OPT_IN_EMPTY;
		}
	}
}


