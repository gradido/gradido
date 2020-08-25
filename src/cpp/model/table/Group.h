#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE

#include "ModelBase.h"

namespace model {
	namespace table {

		class Group : public ModelBase
		{
		public:
			Group();
			~Group();

			// generic db operations
			const char* getTableName() const { return "groups"; }
			std::string toString();


		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			std::string mAlias;
			std::string mName;
			std::string mDescription;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_GROUPS_INCLUDE