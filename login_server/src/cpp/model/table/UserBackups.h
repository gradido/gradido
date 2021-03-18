#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE

#include "ModelBase.h"


namespace model {
	namespace table {

		typedef Poco::Tuple<int, int, std::string, int> UserBackupsTuple;

		class UserBackups : public ModelBase
		{
		public:
			UserBackups(int user_id, const std::string& passphrase, ServerConfig::Mnemonic_Types type);
			UserBackups(const UserBackupsTuple& tuple);
			UserBackups();
			~UserBackups();

			// generic db operations
			const char* getTableName() const { return "user_backups"; }
			std::string toString();

			inline int getUserId() const { return mUserId; }
			inline const std::string& getPassphrase() const { return mPassphrase; }
			inline int getMnemonicType() const { return mMnemonicType; }

			inline void setUserId(int user_Id) { mUserId = user_Id; }


		protected:

			//! \brief call from constructor if mMnemonicType -1
			//! 
			//! for repairing db entries after db update
			//! load user from users, find by user_id
			//! create key pair from passphrase with all mnemonics and find key pair witch matching public key
			//! attention! for invalid mnemonic it will be run every time
			void detectMnemonic();

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int			 mUserId;
			std::string  mPassphrase;
			int			 mMnemonicType;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_USER_BACKUPS_INCLUDE