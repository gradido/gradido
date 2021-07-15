#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_APP_ACCESS_TOKEN_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_APP_ACCESS_TOKEN_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {		

		typedef Poco::Tuple<int, int, Poco::UInt64, Poco::DateTime, Poco::DateTime> AppAccessCodeTuple;

		class AppAccessToken : public ModelBase
		{
		public:
			AppAccessToken(int user_id, const Poco::UInt64& code);
			AppAccessToken(const AppAccessCodeTuple& tuple);
			AppAccessToken();
			

			// generic db operations
			const char* getTableName() const { return "app_access_tokens"; }
			std::string toString();

			inline Poco::UInt64 getCode() const { return mAccessCode; }
			inline int getUserId() const { return mUserId; }
			inline Poco::DateTime getCreated() const { return mCreated; }
			inline Poco::DateTime getUpdated() const { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mUpdated; }
			inline void setCode(Poco::UInt64 code) { mAccessCode = code; }
			inline void setUserId(int user_Id) { mUserId = user_Id; }

			size_t update();

		protected:
			~AppAccessToken();

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);

			int			 mUserId;
			// data type must be a multiple of 4
			Poco::UInt64 mAccessCode;
			Poco::DateTime mCreated;
			Poco::DateTime mUpdated;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_EMAIL_OPT_IN_INCLUDE