#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_RESPONSE_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_RESPONSE_H

/*!
* @author: Dario Rekowski
*
* @date: 03.09.20
*
* @brief: class for simply accessing hedera responses
*
*/

#include "../../proto/hedera/Response.pb.h"
#include "Poco/Types.h"

namespace model {
	namespace hedera {
		class Response
		{
		public:
			Response();
			~Response();
			
			inline proto::Response* getResponsePtr() { return &mResponseProto; }
			Poco::UInt64 getAccountBalance();
			proto::ResponseCodeEnum getResponseCode();

			inline bool isCryptoGetAccountBalanceResponse() { return mResponseProto.has_cryptogetaccountbalance(); }

		protected:
			proto::Response mResponseProto;
			
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_RESPONSE_H