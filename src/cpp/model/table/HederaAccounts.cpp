#include "HederaAccounts.h"

using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		HederaAccounts::HederaAccounts()
		{

		}

		HederaAccounts::~HederaAccounts()
		{

		}

		std::string HederaAccounts::toString()
		{
			std::stringstream ss;
			ss << "user id: " << std::to_string(mUserId) << std::endl;
			ss << "account hedera id: " << std::to_string(mAccountHederaId) << std::endl;
			ss << "account crypto key id: " << std::to_string(mAccountKeyId) << std::endl;
			// balance in tinybars, 100,000,000 tinybar = 1 HashBar
			ss << "account balance: " << std::to_string((double)(mBalance) * 100000000.0) << " HBAR" << std::endl;
			ss << "last update: " << Poco::DateTimeFormatter::format(mUpdated, "%f.%m.%Y %H:%M:%S") << std::endl;

			return ss.str();
		}

		Poco::Data::Statement HederaAccounts::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, account_hedera_id, account_key_id, balance, updated FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mAccountHederaId), into(mAccountKeyId), into(mBalance), into(mUpdated);

			return select;

		}
		Poco::Data::Statement HederaAccounts::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			lock();
			select << "SELECT id FROM " << getTableName()
				<< " where account_hedera_id = ?"
				, into(mID), use(mAccountHederaId);
			unlock();
			return select;
		}
		Poco::Data::Statement HederaAccounts::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			lock();
			insert << "INSERT INTO " << getTableName()
				<< " (user_id, account_hedera_id, account_key_id, balance) VALUES(?,?,?,?)"
				, use(mUserId), use(mAccountHederaId), use(mAccountKeyId), use(mBalance);
			unlock();
			return insert;
		}
	}
}