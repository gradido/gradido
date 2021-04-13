#include "QueryHeader.h"

#include "Transaction.h"

namespace model {
	namespace hedera {
	
		QueryHeader::QueryHeader()
		{
			mProtoQueryHeader.set_responsetype(proto::ANSWER_ONLY);
		}

		QueryHeader::~QueryHeader()
		{

		}

		Poco::AutoPtr<QueryHeader> QueryHeader::createWithPaymentTransaction(
			Poco::AutoPtr<controller::HederaAccount> operatorAccount,
			const controller::NodeServerConnection& connection,
			Poco::UInt32 cost
		) {
			Poco::AutoPtr<QueryHeader> query_header(new QueryHeader);
			auto proto_query_header = query_header->getProtoQueryHeader();
			proto_query_header->set_responsetype(proto::ANSWER_ONLY);
			auto payment_transaction = proto_query_header->mutable_payment();

			query_header->mConnectionString = connection.getUriWithPort();

			Transaction transactionObj(payment_transaction);
			TransactionBody body(operatorAccount->getHederaId(), connection);
			CryptoTransferTransaction transfer_transaction;
			transfer_transaction.addSender(operatorAccount->getHederaId(), cost);
			transfer_transaction.addReceiver(connection.hederaId, cost);
			body.setCryptoTransfer(transfer_transaction);
			transactionObj.sign(operatorAccount->getCryptoKey()->getKeyPair(), &body);
			transactionObj.resetPointer();

			return query_header;
		}

	}
}