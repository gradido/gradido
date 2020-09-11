#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE

#include "ModelBase.h"
#include "Poco/Tuple.h"

#include "NodeServer.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, int, int, int, Poco::UInt64, int, Poco::DateTime> HederaAccountTuple;

		enum HederaNetworkType {
			HEDERA_MAINNET,
			HEDERA_TESTNET,
			HEDERA_NET_COUNT,
		};

		class HederaAccount : public ModelBase
		{
		public:
			HederaAccount();
			HederaAccount(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance = 0, HederaNetworkType type = HEDERA_MAINNET);
			HederaAccount(const HederaAccountTuple& tuple);
			~HederaAccount();

			// generic db operations
			const char* getTableName() const { return "hedera_accounts"; }
			std::string toString();
			

			static const char* hederaNetworkTypeToString(HederaNetworkType type);
			static NodeServerType networkTypeToNodeServerType(HederaNetworkType type);

			inline int getAccountHederaId() const { return mAccountHederaId; }
			inline int getCryptoKeyId() const { return mAccountKeyId; }
			inline int getUserId() const { return mUserId; }

			inline Poco::UInt64 getBalance() { return mBalance; }
			inline double getBalanceDouble() { return (double)mBalance / 100000000.0; }

			inline HederaNetworkType getNetworkType() { return (HederaNetworkType)mType; }
			

			inline std::string getUpdatedString() { return Poco::DateTimeFormatter::format(mUpdated, "%f.%m.%Y %H:%M:%S"); }

		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			int mAccountHederaId;
			int mAccountKeyId;
			Poco::UInt64 mBalance;
			int mType;
			Poco::DateTime mUpdated;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE