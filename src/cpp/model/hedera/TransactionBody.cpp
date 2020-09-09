#include "TransactionBody.h"

namespace model {
	namespace hedera {
		TransactionBody::TransactionBody(Poco::AutoPtr<controller::HederaId> operatorAccountId, const controller::NodeServerConnection& connection)
			: mConnection(connection)
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
			if (cryptoTransferTransaction.validate()) {
				mTransactionBody.set_allocated_cryptotransfer(cryptoTransferTransaction.getProtoTransactionBody());
				cryptoTransferTransaction.resetPointer();
				return true;
			}
			return false;
		}

		bool TransactionBody::setCreateTopic(ConsensusCreateTopic& consensusCreateTopicTransaction)
		{
			if (consensusCreateTopicTransaction.validate()) {
				mTransactionBody.set_allocated_consensuscreatetopic(consensusCreateTopicTransaction.getProtoTransactionBody());
				consensusCreateTopicTransaction.resetPointer();
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