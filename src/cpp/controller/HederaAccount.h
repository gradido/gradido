#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE

#include "HederaId.h"
#include "User.h"
#include "../model/table/HederaAccount.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class HederaAccount : public TableControllerBase
	{
	public:
		~HederaAccount();

		static Poco::AutoPtr<HederaAccount> create(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance = 0, model::table::HederaNetworkType type = model::table::HEDERA_MAINNET);

		static std::vector<Poco::AutoPtr<HederaAccount>> load(const std::string& fieldName, int fieldValue);
		static std::vector<Poco::AutoPtr<HederaAccount>> listAll();

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		std::string HederaAccount::toShortSelectOptionName();

		inline Poco::AutoPtr<model::table::HederaAccount> getModel() { return _getModel<model::table::HederaAccount>(); }

		inline void setHederaId(Poco::AutoPtr<controller::HederaId> hederaId) { mHederaID = hederaId; }
		inline Poco::AutoPtr<controller::HederaId> getHederaId() { return mHederaID; }

		bool hederaAccountGetBalance(Poco::AutoPtr<controller::User> user, NotificationList* errorReceiver = nullptr);

	protected:
		HederaAccount(model::table::HederaAccount* dbModel);
		Poco::AutoPtr<controller::HederaId> mHederaID;

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE