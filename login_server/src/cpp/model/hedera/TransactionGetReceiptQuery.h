#ifndef GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_GET_RECEIPT_QUERY_H
#define GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_GET_RECEIPT_QUERY_H

#include "QueryHeader.h"
#include "../../proto/hedera/TransactionGetReceipt.pb.h"

namespace model {
	namespace hedera {
		class TransactionGetReceiptQuery
		{
		public:
			TransactionGetReceiptQuery(Poco::AutoPtr<QueryHeader> queryHeader, const Transaction* target);
			~TransactionGetReceiptQuery();

			proto::TransactionGetReceiptQuery* getProto() { return &mProtoReceiptQuery; }

			const std::string& getConnectionString() const { return mQueryHeader->getConnectionString(); }

		protected:
			Poco::AutoPtr<QueryHeader> mQueryHeader;
			proto::TransactionGetReceiptQuery mProtoReceiptQuery;
			
		};
	}
}



#endif //GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_GET_RECEIPT_QUERY_H