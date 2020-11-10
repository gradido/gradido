#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_H

/*!
 * @author: Dario Rekowski
 * 
 * @date: 31.08.20
 * 
 * @brief: class for put together hedera querys (ask for state data, not a transaction, but needs a payment transaction)
 *
*/

#include "../../proto/hedera/Query.pb.h"
#include "../../controller/NodeServer.h"
#include "../../Crypto/KeyPairHedera.h"
#include "TransactionBody.h"
#include "QueryHeader.h"

namespace model {
	namespace hedera {
		class Query
		{
		public:
			~Query();
			static Query* getBalance(Poco::AutoPtr<controller::HederaId> accountId, const controller::NodeServerConnection& connection);
			static Query* getTopicInfo(Poco::AutoPtr<controller::HederaId> topicId, Poco::AutoPtr<controller::HederaId> payerAccountId, const controller::NodeServerConnection& connection);
			static Query* getTransactionGetReceiptQuery(
				const proto::TransactionID& transactionId,
				Poco::AutoPtr<controller::HederaAccount> payerAccount,
				const controller::NodeServerConnection& connection
			);
			bool sign(std::unique_ptr<KeyPairHedera> keyPairHedera);

			void setResponseType(proto::ResponseType type);
			proto::ResponseType getResponseType();
			inline bool setTransactionFee(Poco::UInt64 fee) { return mTransactionBody->updateCryptoTransferAmount(fee);}
			
			inline const proto::Query* getProtoQuery() const { return &mQueryProto; }
			inline std::string getConnectionString() const { return mTransactionBody->getConnectionString(); }

			proto::QueryHeader* getQueryHeader();

		protected:
			Query();
			proto::Query mQueryProto;
			Poco::AutoPtr<QueryHeader> mQueryHeader;
			TransactionBody* mTransactionBody;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_H