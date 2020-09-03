#include "Response.h"

namespace model {
	namespace hedera {
		Response::Response()
		{
		}

		Response::~Response()
		{

		}

		Poco::UInt64 Response::getAccountBalance()
		{
			if (isCryptoGetAccountBalanceResponse()) {
				auto balance_response = mResponseProto.cryptogetaccountbalance();
				return balance_response.balance();
			}
			return 0;
		}

		proto::ResponseCodeEnum Response::getResponseCode()
		{
			if (isCryptoGetAccountBalanceResponse()) {
				auto balance_response = mResponseProto.cryptogetaccountbalance();
				return balance_response.header().nodetransactionprecheckcode();
			}
			return proto::NOT_SUPPORTED;
		}
	}
}