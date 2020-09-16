#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H

#include "../proto/hedera/TransactionReceipt.pb.h"

namespace model {
	namespace hedera {
		class TransactionReceipt
		{
		public:
			TransactionReceipt();
			~TransactionReceipt();

			inline proto::TransactionReceipt* getProto() { return &mProtoReceipt; }

		protected:
			proto::TransactionReceipt mProtoReceipt;
			
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RECEIPT_H