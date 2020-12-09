#include "UserRole.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {


		UserRole::UserRole(int user_id, RoleType type)
			: mUserId(user_id), mType(type)
		{

		}

		UserRole::UserRole(const UserRolesTuple& tuple)
			: ModelBase(tuple.get<0>()), mUserId(tuple.get<1>()), mType(tuple.get<2>())
		{

		}
		UserRole::UserRole()
		{

		}

		UserRole::~UserRole()
		{

		}

		Poco::Data::Statement UserRole::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			insert << "INSERT INTO " << getTableName()
				<< " (user_id, role_id) VALUES(?,?)"
				, use(mUserId), bind(mType);
			
			return insert;
		}


		Poco::Data::Statement UserRole::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, role_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mType);


			return select;
		}

		Poco::Data::Statement UserRole::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " where user_id = ? and role_id = ?"
				, into(mID), use(mUserId), use(mType);

			return select;
		}

		Poco::Data::Statement UserRole::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, role_id FROM " << getTableName()
				<< " where " << fieldName << " = ?";


			return select;
		}

		Poco::Data::Statement UserRole::_loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			Poco::Data::Statement select(session);
			if (fieldNames.size() <= 1) {
				throw Poco::NullValueException("UserRoles::_loadFromDB fieldNames empty or contain only one field");
			}

			select << "SELECT user_id, role_id FROM " << getTableName()
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
				addError(new ParamError("UserRoles::_loadFromDB", "condition type not implemented", conditionType));
			}
			//<< " where " << fieldName << " = ?"
			select, into(mUserId), into(mType);


			return select;
		}

		// generic db operations
		std::string UserRole::toString()
		{
			std::stringstream ss;
			ss << "user_id: " << mUserId << std::endl;
			ss << "role: " << typeToString(static_cast<RoleType>(mType));
			return ss.str();
		}

		const char* UserRole::typeToString(RoleType type)
		{
			switch (type) {
			case ROLE_NOT_LOADED: return "not loaded";
			case ROLE_NONE: return "none";
			case ROLE_ADMIN: return "admin";
			default: return "unknown";
			}
		}

	}
}

