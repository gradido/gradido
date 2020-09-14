#include "CryptoCreateTransaction.h"

namespace model {
	namespace hedera {

		CryptoCreateTransaction::CryptoCreateTransaction(const unsigned char* publicKey, Poco::UInt64 initialBalance, int autoRenewPeriod)
		{
			mCryptoCreateBody = new proto::CryptoCreateTransactionBody;
			// public key
			auto key = mCryptoCreateBody->mutable_key();
			auto public_key = new std::string((const char*)publicKey, KeyPairHedera::getPublicKeySize());
			key->set_allocated_ed25519(public_key);

			mCryptoCreateBody->set_initialbalance(initialBalance);

			auto auto_renew_period = mCryptoCreateBody->mutable_autorenewperiod();
			auto_renew_period->set_seconds(autoRenewPeriod);

		}

		CryptoCreateTransaction::~CryptoCreateTransaction()
		{
			if (mCryptoCreateBody) {
				delete mCryptoCreateBody;
				mCryptoCreateBody = nullptr;
			}
		}

		bool CryptoCreateTransaction::validate()
		{
			return true;
		}
	}
}