#ifndef _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CRYPTO_TRANSFER_TRANSACTION_H
#define _GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CRYPTO_TRANSFER_TRANSACTION_H

/*!
* @author: Dario Rekowski
*
* @date: 02.09.20
*
* @brief: class for creating a hedera transfer transaction
*
*/

#include "proto/hedera/CryptoTransfer.pb.h"
#include "../../controller/HederaId.h"

namespace model {
	namespace hedera {
		class CryptoTransferTransaction
		{
		public:
			CryptoTransferTransaction();
			~CryptoTransferTransaction();

			void addSender(Poco::AutoPtr<controller::HederaId> senderAccountId, Poco::UInt64 amountTinybars);
			void addReceiver(Poco::AutoPtr<controller::HederaId> receiverAccountId, Poco::UInt64 amountTinybars);

			bool validate();
			// set pointer to zero, after hand over pointer to transaction body
			inline void resetPointer() { mCryptoTransfer = nullptr; }

			inline proto::CryptoTransferTransactionBody* getProtoTransactionBody() { return mCryptoTransfer; }

		protected:
			proto::CryptoTransferTransactionBody* mCryptoTransfer;
		};
	}
}


#endif //_GRADIDO_LOGIN_SERVER_MODEL_HEDERA_CRYPTO_TRANSFER_TRANSACTION_H
