#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE

#include "ModelBase.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, std::string, std::string, std::string, std::string, std::string, std::string> GroupTuple;

		class Group : public ModelBase
		{
		public:
			Group();
			Group(const std::string& alias, const std::string& name, const std::string& url, const std::string& host, const std::string& home, const std::string& description);
			Group(GroupTuple userTuple);
			
			// generic db operations
			const char* getTableName() const { return "groups"; }
			std::string toString();

			inline const std::string& getAlias() const { return mAlias; }
			inline const std::string& getName() const { std::shared_lock<std::shared_mutex> _lock(mSharedMutex); return mName; }
			inline const std::string& getDescription() const { std::shared_lock<std::shared_mutex> _lock(mSharedMutex);  return mDescription; }
			inline const std::string& getUrl() const { std::shared_lock<std::shared_mutex> _lock(mSharedMutex); return mUrl; }
			inline const std::string& getHost() const { SHARED_LOCK; return mHost; }
			inline const std::string& getHome() const { SHARED_LOCK; return mHome; }

			inline void setName(const std::string& name) { std::unique_lock<std::shared_mutex> _lock(mSharedMutex); mName = name; }
			inline void setDescription(const std::string& desc) { std::unique_lock<std::shared_mutex> _lock(mSharedMutex);  mDescription = desc; }
			inline void setUrl(const std::string& url) { std::unique_lock<std::shared_mutex> _lock(mSharedMutex); mUrl = url; }
			inline void setHost(const std::string& host) { UNIQUE_LOCK; mHost = host; }
			inline void setHome(const std::string& home) { UNIQUE_LOCK; mHome = home; }

		protected:
			~Group();

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadAllFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);
			
			std::string mAlias;
			std::string mName;
			std::string mUrl;
			std::string mHost;
			std::string mHome;
			std::string mDescription;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE