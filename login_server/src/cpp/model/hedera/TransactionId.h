#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_ID_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_ID_H

/*!
* @author: Dario Rekowski
*
* @date: 02.09.20
*
* @brief: class for composing hedera transaction
*
*/

#include "../../proto/hedera/BasicTypes.pb.h"

#include "Poco/JSON/Object.h"

namespace model {
	namespace hedera {
		class TransactionId
		{
		public:
			TransactionId();
			TransactionId(const proto::TransactionID& transaction);
			TransactionId(int shard, int realm, int num, Poco::Timestamp transactionValidStart);
			~TransactionId();

			Poco::JSON::Object::Ptr convertToJSON();

		protected:			
			Poco::Timestamp mTransactionValidStart;
			union {
				struct {
					int shard;
					int realm;
					int num;
				};
				int val[3];
			};
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_ID_H