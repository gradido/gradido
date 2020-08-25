#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE

#include "ModelBase.h"

namespace model {
	namespace table {

		class HederaAccounts : public ModelBase
		{
		public:
			HederaAccounts();
			~HederaAccounts();

			// generic db operations
			const char* getTableName() const { return "hedera_accounts"; }
			std::string toString();


		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			int mAccountHederaId;
			int mAccountKeyId;
			Poco::UInt64 mBalance;
			Poco::DateTime mUpdated;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE