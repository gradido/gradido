#ifndef __GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H
#define __GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H

#include "../../proto/hedera/CryptoCreate.pb.h"

#include "../Crypto/KeyPairHedera.h"

namespace model {
	namespace hedera {

		class CryptoCreateTransaction
		{
		public:
			//! \param publicKey newly created public key from ed25519 public-private key pair for hedera
			CryptoCreateTransaction(const unsigned char* publicKey, Poco::UInt64 initialBalance, int autoRenewPeriod);
			~CryptoCreateTransaction();

			proto::CryptoCreateTransactionBody* getProtoTransactionBody() { return mCryptoCreateBody; }
			inline void resetPointer() { mCryptoCreateBody = nullptr; }

			bool validate();

		protected:
			proto::CryptoCreateTransactionBody* mCryptoCreateBody;
		};
	}
}



#endif //__GRADIDO_LOGIN_MODEL_HEDERA_CRYPTO_CREATE_TRANSACTION_H