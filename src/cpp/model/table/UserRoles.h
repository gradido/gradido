#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_ROLES_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_ROLES_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"
#include "Poco/Tuple.h"
//#include "Roles.h"

namespace model {
	namespace table {

		enum RoleType {
			ROLE_NOT_LOADED = -1,
			ROLE_NONE = 0,
			ROLE_ADMIN = 1
		};

		typedef Poco::Tuple<int, int, int> UserRolesTuple;

		class UserRoles : public ModelBase
		{
		public:
			UserRoles(int user_id, RoleType type);
			UserRoles(const UserRolesTuple& tuple);
			UserRoles();
			~UserRoles();

			// generic db operations
			const char* getTableName() const { return "user_roles"; }
			std::string toString();

			inline int getUserId() const { return mUserId; }
			inline RoleType getType() const { return static_cast<RoleType>(mType); }
			
			inline void setUserId(int user_Id) { mUserId = user_Id; }

			static const char* typeToString(RoleType type);
			protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int			 mUserId;
			int			 mType;

		};
		
	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_ROLES_INCLUDE