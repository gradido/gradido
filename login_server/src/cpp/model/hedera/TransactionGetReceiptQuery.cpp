#include "TransactionGetReceiptQuery.h"

namespace model {
	namespace hedera {
		TransactionGetReceiptQuery::TransactionGetReceiptQuery(Poco::AutoPtr<QueryHeader> queryHeader, const Transaction* target)
			: mQueryHeader(queryHeader)
		{
			mProtoReceiptQuery.set_allocated_header(queryHeader->getProtoQueryHeader());
			auto transaction_id = mProtoReceiptQuery.transactionid();
			transaction_id = target->getTransactionId();
		}

		TransactionGetReceiptQuery::~TransactionGetReceiptQuery()
		{

		}
	}
}