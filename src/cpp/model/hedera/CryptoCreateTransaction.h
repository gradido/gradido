#ifndef __GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H
#define __GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H

#include "../../proto/hedera/CryptoCreate.pb.h"

namespace model {
	namespace hedera {

		class CryptoCreateTransaction
		{
		public:
			CryptoCreateTransaction();
			~CryptoCreateTransaction();

		protected:
			proto::CryptoCreateTransactionBody* mCryptoCreateBody;
		};
	}
}



#endif //__GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H