#include "HederaAccount.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		HederaAccount::HederaAccount()
			: mUserId(0), mAccountHederaId(0), mAccountKeyId(0), mBalance(0), mType(0)
		{
			
		}

		HederaAccount::HederaAccount(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance/* = 0*/, ServerConfig::HederaNetworkType type /*= ServerConfig::HEDERA_MAINNET*/)
			: mUserId(user_id), mAccountHederaId(account_hedera_id), mAccountKeyId(account_key_id), mBalance(balance), mType(type)
		{
			
		}

		HederaAccount::HederaAccount(const HederaAccountTuple& tuple)
			: ModelBase(tuple.get<0>()),
			mUserId(tuple.get<1>()), mAccountHederaId(tuple.get<2>()), mAccountKeyId(tuple.get<3>()),
			mBalance(tuple.get<4>()), mType(tuple.get<5>()), mUpdated(tuple.get<6>())
		{
			
		}

		HederaAccount::~HederaAccount()
		{
		
		}

		std::string HederaAccount::toString()
		{
			std::stringstream ss;
			ss << "user id: " << std::to_string(mUserId) << std::endl;
			ss << "account hedera id: " << std::to_string(mAccountHederaId) << std::endl;
			ss << "account crypto key id: " << std::to_string(mAccountKeyId) << std::endl;
			// balance in tinybars, 100,000,000 tinybar = 1 HashBar
			ss << "account balance: " << std::to_string((double)(mBalance) * 100000000.0) << " HBAR" << std::endl;
			ss << "Hedera Net Type: " << hederaNetworkTypeToString((ServerConfig::HederaNetworkType)mType) << std::endl;
			ss << "last update: " << Poco::DateTimeFormatter::format(mUpdated, "%f.%m.%Y %H:%M:%S") << std::endl;

			return ss.str();
		}

		std::string HederaAccount::getBalanceString()
		{
			char buffer[65]; memset(buffer, 0, 65);
			//100,000,000
#ifdef _WIN32
			sprintf_s(buffer, 64, "%.8f HBAR", (double)(mBalance) / 100000000.0);
#else
			sprintf(buffer, "%.8f HBAR", (double)(mBalance) / 100000000.0);
#endif
			return std::string(buffer);
		}


		const char* HederaAccount::hederaNetworkTypeToString(ServerConfig::HederaNetworkType type)
		{
			switch (type) {
			case ServerConfig::HEDERA_MAINNET: return "Mainnet";
			case ServerConfig::HEDERA_TESTNET: return "Testnet";
			case ServerConfig::HEDERA_UNKNOWN: return "unknown";
			default: return "<unknown>";
			}
		}

		ServerConfig::HederaNetworkType HederaAccount::hederaNetworkTypeFromString(const std::string& typeString)
		{
			if ("MAINNET" == typeString || "Mainnet" == typeString) {
				return ServerConfig::HEDERA_MAINNET;
			}
			if ("TESTNET" == typeString || "Testnet" == typeString) {
				return ServerConfig::HEDERA_TESTNET;
			}
			return ServerConfig::HEDERA_UNKNOWN;
		}

		NodeServerType HederaAccount::networkTypeToNodeServerType(ServerConfig::HederaNetworkType type)
		{
			switch (type) {
			case ServerConfig::HEDERA_MAINNET: return NODE_SERVER_HEDERA_MAINNET_NODE;
			case ServerConfig::HEDERA_TESTNET: return NODE_SERVER_HEDERA_TESTNET_NODE;
			default: return NODE_SERVER_TYPE_NONE;
			}
		}

		Poco::Data::Statement HederaAccount::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, account_hedera_id, account_key_id, balance, network_type, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mAccountHederaId), into(mAccountKeyId), into(mBalance), into(mType), into(mUpdated);

			return select;

		}

		Poco::Data::Statement HederaAccount::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);
			select << "SELECT id, user_id, account_hedera_id, account_key_id, balance, network_type, updated FROM " << getTableName()
				<< " where " << fieldName << " LIKE ?";

			return select;
		}
		Poco::Data::Statement HederaAccount::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where account_hedera_id = ?"
				, into(mID), use(mAccountHederaId);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaAccount::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (user_id, account_hedera_id, account_key_id, balance, network_type) VALUES(?,?,?,?,?)"
				, use(mUserId), use(mAccountHederaId), use(mAccountKeyId), use(mBalance), use(mType);
			unlock();
			return insert;
		}

		
	}
}