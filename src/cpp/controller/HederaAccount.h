#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE

#include "../model/table/HederaAccount.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class HederaAccount : public TableControllerBase
	{
	public:

		~HederaAccount();

		static Poco::AutoPtr<HederaAccount> create(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance = 0);

		static std::vector<Poco::AutoPtr<HederaAccount>> load(const std::string& alias);
		static std::vector<Poco::AutoPtr<HederaAccount>> listAll();

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::HederaAccount> getModel() { return _getModel<model::table::HederaAccount>(); }


	protected:
		HederaAccount(model::table::HederaAccount* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE