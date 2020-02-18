#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE

#include "ModelBase.h"


namespace model {
	namespace table {

		typedef Poco::Tuple<int, int, std::string> UserBackupsTuple;

		class UserBackups : public ModelBase
		{
		public:
			UserBackups(int user_id, const std::string& passphrase);
			UserBackups(const UserBackupsTuple& tuple);
			UserBackups();
			~UserBackups();

			// generic db operations
			const char* getTableName() const { return "user_backups"; }
			std::string toString();

			inline int getUserId() const { return mUserId; }
			inline const std::string& getPassphrase() const { return mPassphrase; }

			inline void setUserId(int user_Id) { mUserId = user_Id; }

		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int			 mUserId;
			std::string  mPassphrase;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE