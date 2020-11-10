#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H

#include "../proto/hedera/QueryHeader.pb.h"
#include "Transaction.h"

#include "../../controller/User.h"
#include "../../controller/HederaAccount.h"

namespace model {
	namespace hedera {
		class QueryHeader : public Poco::RefCountedObject
		{
		public: 
			~QueryHeader();

			//! for cost look here: https://www.hedera.com/fees 
			//! or make query first with response type COST_ANSWER
			//! TODO: get cost from network
			static Poco::AutoPtr<QueryHeader> createWithPaymentTransaction(
				Poco::AutoPtr<controller::HederaAccount> operatorAccount,
				const controller::NodeServerConnection& connection,
				Poco::UInt32 cost
			);

			void setResponseType(proto::ResponseType type) { mProtoQueryHeader.set_responsetype(type); };
			proto::ResponseType getResponseType() const { return mProtoQueryHeader.responsetype(); }

			proto::QueryHeader* getProtoQueryHeader() { return &mProtoQueryHeader; }

			const std::string& getConnectionString() const { return mConnectionString; }

		protected:
			proto::QueryHeader mProtoQueryHeader;
			std::string mConnectionString;
			QueryHeader();
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H