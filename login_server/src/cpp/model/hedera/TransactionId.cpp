#include "TransactionId.h"

#include "../../lib/DataTypeConverter.h"

namespace model {
	namespace hedera {
		TransactionId::TransactionId()
			: shard(0), realm(0), num(0)
		{

		}

		TransactionId::TransactionId(const proto::TransactionID& transaction)
		{
			auto account_id = transaction.accountid();
			shard = account_id.shardnum();
			realm = account_id.realmnum();
			num = account_id.accountnum();
			mTransactionValidStart = DataTypeConverter::convertFromProtoTimestamp(transaction.transactionvalidstart());

		}

		TransactionId::TransactionId(int shard, int realm, int num, Poco::Timestamp transactionValidStart)
			: shard(shard), realm(realm), num(num), mTransactionValidStart(transactionValidStart)
		{

		}

		TransactionId::~TransactionId()
		{

		}

		Poco::JSON::Object::Ptr TransactionId::convertToJSON()
		{
			Poco::JSON::Object::Ptr result = new Poco::JSON::Object;
			result->set("transactionValidStart", mTransactionValidStart);
			Poco::JSON::Object accountId;
			accountId.set("shard", shard);
			accountId.set("realm", realm);
			accountId.set("num", num);
			result->set("accountId", accountId);
			return result;
		}

	}
}