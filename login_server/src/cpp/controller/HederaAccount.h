#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE

#include "HederaId.h"
#include "User.h"
#include "../model/table/HederaAccount.h"

#include "../model/hedera/TransactionBody.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"
#include "CryptoKey.h"

namespace controller {
	class HederaAccount : public TableControllerBase, public NotificationList
	{
	public:
		~HederaAccount();

		static Poco::AutoPtr<HederaAccount> create(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance = 0, ServerConfig::HederaNetworkType type = ServerConfig::HEDERA_MAINNET);

		static std::vector<Poco::AutoPtr<HederaAccount>> load(const std::string& fieldName, int fieldValue);
		static Poco::AutoPtr<HederaAccount> load(int id);
		static Poco::AutoPtr<HederaAccount> load(Poco::AutoPtr<controller::HederaId> hederaId);
		static std::vector<Poco::AutoPtr<HederaAccount>> listAll();
		//! \brief for picking a account for paying transaction, mostly consensusSendMessage
		static Poco::AutoPtr<HederaAccount> pick(ServerConfig::HederaNetworkType networkType, bool encrypted = false, int user_id = 0);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		std::string toShortSelectOptionName();

		inline Poco::AutoPtr<model::table::HederaAccount> getModel() { return _getModel<model::table::HederaAccount>(); }
		inline const model::table::HederaAccount* getModel() const { return _getModel<model::table::HederaAccount>(); }

		inline void setHederaId(Poco::AutoPtr<controller::HederaId> hederaId) { mHederaID = hederaId; }
		Poco::AutoPtr<controller::HederaId> getHederaId();

		Poco::AutoPtr<controller::CryptoKey> getCryptoKey() const;

		bool hederaAccountGetBalance(Poco::AutoPtr<controller::User> user);
		bool hederaAccountCreate(int autoRenewPeriodSeconds, double initialBalance);
		bool changeEncryption(Poco::AutoPtr<controller::User> user);

		//! \brief create Transaction body with this hedera account as operator
		std::unique_ptr<model::hedera::TransactionBody> createTransactionBody();

	protected:

		HederaAccount(model::table::HederaAccount* dbModel);
		Poco::AutoPtr<HederaId> mHederaID;
	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ACCOUNT_INCLUDE
