#include "TransactionRecord.h"

namespace model {
	namespace hedera {
		TransactionRecord::TransactionRecord(const proto::TransactionRecord& transaction_record)
			: mProtoRecord(transaction_record)
		{

		}

	}
}