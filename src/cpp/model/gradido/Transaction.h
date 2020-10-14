#ifndef GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
#define GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H

/*
 * @author: Dario Rekowski
 * 
 * @date: 12.10.2020
 * 
 * @brief: mainly for signing gradido transaction 
*/

#include "../../proto/gradido/GradidoTransaction.pb.h"
#include "TransactionBody.h"
#include "../../controller/User.h"


namespace model {
	namespace gradido {
		class Transaction : public NotificationList
		{
		public:
			Transaction(Poco::AutoPtr<TransactionBody> body);
			~Transaction();

			bool addSign(Poco::AutoPtr<controller::User> user);
			TransactionValidation validate();
			

		protected:
			Poco::AutoPtr<TransactionBody> mTransactionBody;
			proto::gradido::GradidoTransaction mProtoTransaction;
			HASH mBodyBytesHash;
		};
	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
