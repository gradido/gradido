#include "Query.h"
#include "Poco/Timestamp.h"
#include "../../SingletonManager/MemoryManager.h"

#include "Transaction.h"
#include "TransactionBody.h"
#include "CryptoTransferTransaction.h"

namespace model {
	namespace hedera {

		Query::Query()
			: mTransactionBody(nullptr)
		{

		}

		Query::~Query()
		{
			if (mTransactionBody) {
				delete mTransactionBody;
			}
		}

		Query* Query::getBalance(Poco::AutoPtr<controller::HederaId> accountId, const controller::NodeServerConnection& connection)
		{
		
			assert(!accountId.isNull() && accountId->getModel());

			printf("[Query::getBalance] account id: %s\n", accountId->getModel()->toString().data());

			auto query = new Query;
			auto get_account_balance = query->mQueryProto.mutable_cryptogetaccountbalance();
			accountId->copyToProtoAccountId(get_account_balance->mutable_accountid());
			auto query_header = get_account_balance->mutable_header();
			query_header->set_responsetype(proto::COST_ANSWER);

			query->mTransactionBody = new TransactionBody(accountId, connection);
			CryptoTransferTransaction crypto_transaction;
			crypto_transaction.addSender(accountId, 0);
			crypto_transaction.addReceiver(connection.hederaId, 0);
			query->mTransactionBody->setCryptoTransfer(crypto_transaction);

			//auto transaction = query_header->mutable_payment();
			//auto transaction_body = transaction->mutable_body();
			// body content
			// node account id
			

			return query;
		}

		Query* Query::getTopicInfo(Poco::AutoPtr<controller::HederaId> topicId, Poco::AutoPtr<controller::HederaId> payerAccountId, const controller::NodeServerConnection& connection)
		{
			assert(!topicId.isNull() && topicId->getModel());
			assert(!payerAccountId.isNull() && payerAccountId->getModel());

			printf("[Query::getBalance] topic id: %s\n", topicId->getModel()->toString().data());
			printf("[Query::getBalance] payer account id: %s\n", payerAccountId->getModel()->toString().data());

			auto query = new Query;
			auto get_topic_info = query->mQueryProto.mutable_consensusgettopicinfo();
			topicId->copyToProtoTopicId(get_topic_info->mutable_topicid());

			auto query_header = get_topic_info->mutable_header();
			query_header->set_responsetype(proto::ANSWER_ONLY);

			query->mTransactionBody = new TransactionBody(payerAccountId, connection);
			CryptoTransferTransaction crypto_transaction;
			// 0.002809 Hashbars
			// fee from https://www.hedera.com/fees
			crypto_transaction.addSender(payerAccountId, 2809);
			crypto_transaction.addReceiver(connection.hederaId, 2809);
			query->mTransactionBody->setCryptoTransfer(crypto_transaction);

			return query;
		}

		bool Query::sign(std::unique_ptr<KeyPairHedera> keyPairHedera)
		{
			Transaction transaction;
			auto sign_result = transaction.sign(std::move(keyPairHedera), mTransactionBody);
			auto query_header = mQueryProto.mutable_cryptogetaccountbalance()->mutable_header();
			query_header->set_allocated_payment(transaction.getTransaction());
			transaction.resetPointer();

			return sign_result;
		}

		void Query::setResponseType(proto::ResponseType type)
		{
			auto get_account_balance = mQueryProto.mutable_cryptogetaccountbalance();
			auto query_header = get_account_balance->mutable_header();
			query_header->set_responsetype(type);

		}

		proto::ResponseType Query::getResponseType()
		{
			auto get_account_balance = mQueryProto.mutable_cryptogetaccountbalance();
			auto query_header = get_account_balance->mutable_header();
			return query_header->responsetype();
		}

		
	}
}