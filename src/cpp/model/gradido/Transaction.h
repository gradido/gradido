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
#include "../../tasks/GradidoTask.h"
#include "../../controller/User.h"


namespace model {
	namespace gradido {
		class Transaction : public GradidoTask
		{
		public:
			Transaction(Poco::AutoPtr<TransactionBody> body);
			Transaction(const std::string& protoMessageBin, model::table::PendingTask* dbModel);
			~Transaction();

			// create group add member transaction
			static Poco::AutoPtr<Transaction> create(Poco::AutoPtr<controller::User> user, Poco::AutoPtr<controller::Group> group);
			static Poco::AutoPtr<Transaction> load(model::table::PendingTask* dbModel);

			bool addSign(Poco::AutoPtr<controller::User> user);
			TransactionValidation validate();
			
			inline Poco::AutoPtr<TransactionBody> getTransactionBody() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mTransactionBody; }

			//! \brief get current body bytes from proto transaction and save it into db
			bool updateRequestInDB();
			bool insertPendingTaskIntoDB(Poco::AutoPtr<controller::User> user, model::table::TaskType type);

		protected:
			Poco::AutoPtr<TransactionBody> mTransactionBody;
			proto::gradido::GradidoTransaction mProtoTransaction;
			HASH mBodyBytesHash;
		};
	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
