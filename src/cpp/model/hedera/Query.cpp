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