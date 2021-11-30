#ifndef GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
#define GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H

/*
 * @author: Dario Rekowski
 *
 * @date: 12.10.2020
 *
 * @brief: mainly for signing gradido transaction
*/

#include "proto/gradido/GradidoTransaction.pb.h"
#include "TransactionBody.h"
#include "../../tasks/GradidoTask.h"
#include "../../controller/User.h"

#include "../../tasks/CPUTask.h"

namespace model {
	namespace gradido {

		class SendTransactionTask;

		class Transaction : public GradidoTask
		{
			friend SendTransactionTask;
		public:
			Transaction(Poco::AutoPtr<TransactionBody> body);
			Transaction(const std::string& protoMessageBin, model::table::PendingTask* dbModel);
			~Transaction();

			// create group add member transaction
			// groupMemberUpdate
			static Poco::AutoPtr<Transaction> createGroupMemberUpdate(
				Poco::AutoPtr<controller::User> user,
				Poco::AutoPtr<controller::Group> group,
				BlockchainType blockchainType
			);
			//! \brief transfer
			//! \return
			static Poco::AutoPtr<Transaction> createTransferLocal(
				Poco::AutoPtr<controller::User> sender,
				const MemoryBin* receiverPubkey,
				Poco::UInt32 amount,
				const std::string& memo,
				BlockchainType blockchainType
			);
			static Poco::AutoPtr<Transaction> createTransferCrossGroup(
				Poco::AutoPtr<controller::User> sender,
				const MemoryBin* receiverPubkey,
				Poco::AutoPtr<controller::Group> receiverGroup,
				Poco::UInt32 amount,
				const std::string& memo,
				BlockchainType blockchainType);

			//! \brief creation transaction
			static Poco::AutoPtr<Transaction> createCreation(
				Poco::AutoPtr<controller::User> receiver,
				Poco::UInt32 amount,
				Poco::DateTime targetDate,
				const std::string& memo,
				BlockchainType blockchainType,
				bool addToPendingTaskManager = true);

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

			//! \return true if user must sign it and hasn't yet
			bool mustSign(Poco::AutoPtr<controller::User> user);
			//! return true if user can sign transaction and hasn't yet
			bool canSign(Poco::AutoPtr<controller::User> user);

			//! \return true if user has already signed transaction
			bool hasSigned(Poco::AutoPtr<controller::User> user);
			//! \return true if at least one sign is missing and user isn't forbidden and isn't required
			bool needSomeoneToSign(Poco::AutoPtr<controller::User> user);

			std::string getTransactionAsJson(bool replaceBase64WithHex = false);

			// use with care, only available after freshly creating cross group transfer transaction, not after loading from db
			inline Poco::AutoPtr<Transaction> getPairedTransaction() { return mPairedTransaction; }

			bool isTheSameTransaction(Poco::AutoPtr<Transaction> other);

			const proto::gradido::GradidoTransaction& getProtoTransaction() { return mProtoTransaction; }

		protected:

			bool ifEnoughSignsProceed(Poco::AutoPtr<controller::User> user);

			int runSendTransactionMysql(const std::string& transaction_base64, Poco::AutoPtr<controller::Group> group);
			int runSendTransactionIota(const std::string& transaction_hex, const std::string& groupAlias);

			Poco::AutoPtr<Transaction> mPairedTransaction;

			Poco::AutoPtr<TransactionBody> mTransactionBody;
			proto::gradido::GradidoTransaction mProtoTransaction;
			HASH mBodyBytesHash;
		};

		class SendTransactionTask : public UniLib::controller::CPUTask
		{
		public:
			SendTransactionTask(Poco::AutoPtr<Transaction> transaction, const std::string& groupAlias);

			const char* getResourceType() const { return "SendTransactionTask"; };
			int run();
		protected:
			Poco::AutoPtr<Transaction> mTransaction;
			std::string mGroupAlias;
		};

	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_H
