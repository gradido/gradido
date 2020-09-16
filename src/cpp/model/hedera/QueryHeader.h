#ifndef __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H
#define __GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H

#include "../proto/hedera/QueryHeader.pb.h"
#include "Transaction.h"

namespace model {
	namespace hedera {
		class QueryHeader 
		{
		public: 
			QueryHeader(Transaction* paymentTransaction);
			~QueryHeader();

			void setResponseType(proto::ResponseType type) { mProtoQueryHeader.set_responsetype(type); };
			proto::ResponseType getResponseType() const { return mProtoQueryHeader.responsetype(); }

		protected:
			proto::QueryHeader mProtoQueryHeader;

		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_HEDERA_QUERY_HEADER_H