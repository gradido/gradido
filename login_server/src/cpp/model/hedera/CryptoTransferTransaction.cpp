#include "CryptoTransferTransaction.h"

namespace model {
	namespace hedera {

		CryptoTransferTransaction::CryptoTransferTransaction()
			: mCryptoTransfer(nullptr)
		{
			mCryptoTransfer = new proto::CryptoTransferTransactionBody;
		}

		CryptoTransferTransaction::~CryptoTransferTransaction()
		{
			if (mCryptoTransfer) {
				delete mCryptoTransfer;
				mCryptoTransfer = nullptr;
			}
		}

		void CryptoTransferTransaction::addSender(Poco::AutoPtr<controller::HederaId> senderAccountId, Poco::UInt64 amountTinybars)
		{
			auto transfers = mCryptoTransfer->mutable_transfers();
			auto accountAmounts = transfers->add_accountamounts();
			accountAmounts->set_amount(-(Poco::Int64)amountTinybars);
			senderAccountId->copyToProtoAccountId(accountAmounts->mutable_accountid());
		}
		void CryptoTransferTransaction::addReceiver(Poco::AutoPtr<controller::HederaId> receiverAccountId, Poco::UInt64 amountTinybars)
		{
			auto transfers = mCryptoTransfer->mutable_transfers();
			auto accountAmounts = transfers->add_accountamounts();
			accountAmounts->set_amount(amountTinybars);
			receiverAccountId->copyToProtoAccountId(accountAmounts->mutable_accountid());
		}

		bool CryptoTransferTransaction::validate()
		{
			auto transfers = mCryptoTransfer->mutable_transfers();
			auto account_amounts = transfers->accountamounts();
			Poco::Int64 sum = 0;
			for (int i = 0; i < transfers->accountamounts_size(); i++) {
				auto account_amount = account_amounts.Mutable(i);
				sum += account_amount->amount();
			}
			return 0 == sum && transfers->accountamounts_size() > 0;
		}
	}
}

