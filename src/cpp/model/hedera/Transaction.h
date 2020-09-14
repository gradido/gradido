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
			bool sign(std::unique_ptr<KeyPairHedera> keyPairHedera, std::unique_ptr<TransactionBody> transactionBody);
			
			inline proto::Transaction* getTransaction() { return mTransaction; }
			inline std::string getConnectionString() const { return mConnection.getUriWithPort(); }
			void resetPointer() { mTransaction = nullptr; }
			inline TransactionBodyType getType() const { return mType; }

		protected:
			proto::Transaction* mTransaction;
			controller::NodeServerConnection mConnection;
			TransactionBodyType mType;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_TRANSACTION_H