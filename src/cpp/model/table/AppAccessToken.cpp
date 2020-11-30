#include "AppAccessToken.h"
 

using namespace Poco::Data::Keywords;

namespace model
{
	namespace table {

	

		AppAccessToken::AppAccessToken()
			: mUserId(0), mAccessCode(0)
		{

		}

		AppAccessToken::AppAccessToken(int user_id, const Poco::UInt64& code)
			: mUserId(user_id), mAccessCode(code)
		{

		}

		AppAccessToken::AppAccessToken(const AppAccessCodeTuple& tuple)
			: ModelBase(tuple.get<0>()), mUserId(tuple.get<1>()), mAccessCode(tuple.get<2>()), mCreated(tuple.get<3>()), mUpdated(tuple.get<4>())
		{

		}

		AppAccessToken::~AppAccessToken()
		{

		}

		std::string AppAccessToken::toString()
		{
			std::stringstream ss;
			ss << "id: " << std::to_string(mID) << std::endl;
			ss << "user id: " << std::to_string(mUserId) << std::endl;
			ss << "code: " << std::to_string(mAccessCode) << std::endl;

			return ss.str();
		}

		Poco::Data::Statement AppAccessToken::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			lock();
			assert(mUserId > 0);
			assert(mAccessCode > 0);

			insert << "INSERT INTO " << getTableName()
				<< " (user_id, access_code) VALUES(?,?)"
				, use(mUserId), use(mAccessCode);
			unlock();
			mUpdated = Poco::DateTime();
			mCreated = Poco::DateTime();
			return insert;
		}

		size_t AppAccessToken::update()
		{
			return updateIntoDB("update", Poco::DateTime());
		}


		Poco::Data::Statement AppAccessToken::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, access_code, created, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mAccessCode), into(mCreated), into(mUpdated);


			return select;
		}

		Poco::Data::Statement AppAccessToken::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where access_code = ?"
				, into(mID), use(mAccessCode);

			return select;
		}
		Poco::Data::Statement AppAccessToken::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, access_code, created, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?";


			return select;
		}

		Poco::Data::Statement AppAccessToken::_loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("AppAccessToken::_loadFromDB fieldNames empty or contain only one field");
			}

			select << "SELECT id, user_id, access_code, created, updated FROM " << getTableName()
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
				addError(new ParamError("AppAccessToken::_loadFromDB", "condition type not implemented", conditionType));
			}
			//<< " where " << fieldName << " = ?"
			select, into(mID), into(mUserId), into(mAccessCode), into(mCreated), into(mUpdated);


			return select;
		}
	}
}