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

namespace model {
	namespace hedera {
		class Query
		{
		public:
			~Query();
			static Query* getBalance(Poco::AutoPtr<controller::HederaId> accountId, const controller::NodeServerConnection& connection);
			bool sign(std::unique_ptr<KeyPairHedera> keyPairHedera);

			void setResponseType(proto::ResponseType type);
			proto::ResponseType getResponseType();
			void setFee(Poco::UInt64 fee);
			inline const proto::Query* getProtoQuery() const { return &mQueryProto; }
			inline std::string getConnectionString() const { return mConnection.getUriWithPort(); }

		protected:
			Query(const controller::NodeServerConnection& connection);
			proto::Query mQueryProto;
			TransactionBody* mTransactionBody;
			controller::NodeServerConnection mConnection;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_H