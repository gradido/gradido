#include "QueryHeader.h"

namespace model {
	namespace hedera {
		QueryHeader::QueryHeader(Transaction* paymentTransaction)
		{
			mProtoQueryHeader.set_responsetype(proto::ANSWER_ONLY);
		}

		QueryHeader::~QueryHeader()
		{

		}

	}
}