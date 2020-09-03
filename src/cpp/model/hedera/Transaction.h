#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_H

/*!
* @author: Dario Rekowski
*
* @date: 02.09.20
*
* @brief: class for composing hedera transaction
*
*/

#include "../../proto/hedera/Transaction.pb.h"
#include "../../Crypto/KeyPairHedera.h"
#include "TransactionBody.h"

namespace model {
	namespace hedera {
		class Transaction
		{
		public:
			Transaction();
			~Transaction();

			bool sign(std::unique_ptr<KeyPairHedera> keyPairHedera, const TransactionBody* transactionBody);
			
			inline proto::Transaction* getTransaction() { return mTransaction; }
			void resetPointer() { mTransaction = nullptr; }

		protected:

			proto::Transaction* mTransaction;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_H