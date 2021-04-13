#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RESPONSE_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RESPONSE_H

#include "../../proto/hedera/TransactionResponse.pb.h"
#include "Poco/Types.h"

namespace model {
	namespace hedera {

		class TransactionResponse
		{
		public:
			TransactionResponse();
			~TransactionResponse();

			inline proto::ResponseCodeEnum getPrecheckCode() const { return mProtoResponse.nodetransactionprecheckcode();}
			inline std::string getPrecheckCodeString() const { return proto::ResponseCodeEnum_Name(mProtoResponse.nodetransactionprecheckcode()); }
			inline Poco::UInt64 getCost() const { return mProtoResponse.cost(); }

			proto::TransactionResponse* getProtoResponse() { return &mProtoResponse; }
		protected:
			proto::TransactionResponse mProtoResponse;

		};
	}
}



#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_RESPONSE_H