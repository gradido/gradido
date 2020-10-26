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

#include "../tasks/CPUTask.h"

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

			bool sign(Poco::AutoPtr<controller::User> user);
			int getSignCount() { return mProtoTransaction.sig_map().sigpair_size(); }
			TransactionValidation validate();

			//! \brief validate and if valid send transaction via Hedera Consensus Service to node server
			int runSendTransaction();
			
			inline Poco::AutoPtr<TransactionBody> getTransactionBody() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mTransactionBody; }

			//! \brief get current body bytes from proto transaction and save it into db
			bool updateRequestInDB();
			bool insertPendingTaskIntoDB(Poco::AutoPtr<controller::User> user, model::table::TaskType type);

			//! return true if user must sign it and hasn't yet
			bool mustSign(Poco::AutoPtr<controller::User> user);
			//! return true if user can sign transaction and hasn't yet
			bool canSign(Poco::AutoPtr<controller::User> user);

			//! return true if user has already signed transaction
			bool hasSigned(Poco::AutoPtr<controller::User> user);

		protected:
			Poco::AutoPtr<TransactionBody> mTransactionBody;
			proto::gradido::GradidoTransaction mProtoTransaction;
			HASH mBodyBytesHash;
		};

		class SendTransactionTask : public UniLib::controller::CPUTask
		{
		public:
			SendTransactionTask(Poco::AutoPtr<Transaction> transaction);

			const char* getResourceType() const { return "SendTransactionTask"; };
			int run();
		protected:
			Poco::AutoPtr<Transaction> mTransaction;
		};

	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
