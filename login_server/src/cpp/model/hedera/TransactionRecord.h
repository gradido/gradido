#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECORD_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECORD_H

#include "../../proto/hedera/TransactionRecord.pb.h"

namespace model
{
	namespace hedera 
	{
		class TransactionRecord
		{
		public:
			TransactionRecord(const proto::TransactionRecord& transaction_record);


			inline proto::TransactionRecord* getProto() { return &mProtoRecord; }

		protected:
			proto::TransactionRecord mProtoRecord;
		};

	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECORD_H

