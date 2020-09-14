#include "TransactionBody.h"

namespace model {
	namespace hedera {
		TransactionBody::TransactionBody(Poco::AutoPtr<controller::HederaId> operatorAccountId, const controller::NodeServerConnection& connection)
			: mConnection(connection), mHasBody(false)
		{
			connection.hederaId->copyToProtoAccountId(mTransactionBody.mutable_nodeaccountid());
			auto transaction_id = mTransactionBody.mutable_transactionid();
			operatorAccountId->copyToProtoAccountId(transaction_id->mutable_accountid());
			mTransactionBody.set_transactionfee(10000);
			auto transaction_valid_duration = mTransactionBody.mutable_transactionvalidduration();
			transaction_valid_duration->set_seconds(120);

			updateTimestamp();
		}

		TransactionBody::~TransactionBody()
		{

		}

		bool TransactionBody::setCryptoTransfer(CryptoTransferTransaction& cryptoTransferTransaction)
		{
			if (mHasBody) {
				printf("[TransactionBody::setCryptoTransfer] has already a body\n");
				return false;
			}
			if (cryptoTransferTransaction.validate()) {
				mTransactionBody.set_allocated_cryptotransfer(cryptoTransferTransaction.getProtoTransactionBody());
				cryptoTransferTransaction.resetPointer();
				mHasBody = true;
				mType = TRANSACTION_CRYPTO_TRANSFER;
				return true;
			}
			return false;
		}

		bool TransactionBody::setCreateTopic(ConsensusCreateTopic& consensusCreateTopicTransaction)
		{
			if (mHasBody) {
				printf("[TransactionBody::setCreateTopic] has already a body\n");
				return false;
			}
			if (consensusCreateTopicTransaction.validate()) {
				mTransactionBody.set_allocated_consensuscreatetopic(consensusCreateTopicTransaction.getProtoTransactionBody());
				consensusCreateTopicTransaction.resetPointer();
				mHasBody = true;
				mType = TRANSACTION_CONSENSUS_CREATE_TOPIC;
				return true;
			}
			return false;
		}

		bool TransactionBody::setCryptoCreate(CryptoCreateTransaction& cryptoCreateTransaction)
		{
			if (mHasBody) {
				printf("[TransactionBody::setCryptoCreate] has already a body\n");
				return false;
			}
			if (cryptoCreateTransaction.validate()) {
				mTransactionBody.set_allocated_cryptocreateaccount(cryptoCreateTransaction.getProtoTransactionBody());
				cryptoCreateTransaction.resetPointer();
				mHasBody = true;
				mType = TRANSACTION_CRYPTO_CREATE;
				return true;
			}
			return false;
		}

		bool TransactionBody::setConsensusSubmitMessage(ConsensusSubmitMessage& consensusSubmitMessageTransaction)
		{
			if (mHasBody) {
				printf("[TransactionBody::setConsensusSubmitMessage] has already a body\n");
				return false;
			}
			if (consensusSubmitMessageTransaction.validate()) {
				mTransactionBody.set_allocated_consensussubmitmessage(consensusSubmitMessageTransaction.getProtoTransactionBody());
				consensusSubmitMessageTransaction.resetPointer();
				mHasBody = true;
				mType = TRANSACTION_CONSENSUS_SUBMIT_MESSAGE;
				return true;
			}
			return false;
		}

		void TransactionBody::setMemo(const std::string& memo)
		{
			mTransactionBody.set_memo(memo);
		}
		void TransactionBody::setFee(Poco::UInt64 fee)
		{
			mTransactionBody.set_transactionfee(fee);
		}

		void TransactionBody::updateTimestamp()
		{
			auto transaction_id = mTransactionBody.mutable_transactionid();
			auto timestamp = transaction_id->mutable_transactionvalidstart();
			Poco::Timestamp now;
			auto microseconds = now.epochMicroseconds() - now.epochTime() * now.resolution(); // 1*10^6
			timestamp->set_seconds(now.epochTime());
			timestamp->set_nanos(microseconds * 1000);
		}
	}
}