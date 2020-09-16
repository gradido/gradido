#include "Transaction.h"

namespace model {
	namespace hedera {
		Transaction::Transaction()
			: mTransaction(nullptr)
		{
			mTransaction = new proto::Transaction;
		}

		Transaction::~Transaction()
		{
			if (mTransaction) {
				delete mTransaction;
				mTransaction = nullptr;
			}
		}

		bool Transaction::sign(std::unique_ptr<KeyPairHedera> keyPairHedera, const TransactionBody* transactionBody)
		{
			mType = transactionBody->getType();

			auto mm = MemoryManager::getInstance();
			mConnection = transactionBody->getConnection();
			auto transaction_body_proto = transactionBody->getProtoTransactionBody();
			auto body_bytes = transaction_body_proto->SerializeAsString();
			mTransaction->set_bodybytes(body_bytes.data());
			auto signature_map = mTransaction->mutable_sigmap();
			auto signature_pairs = signature_map->mutable_sigpair();
			signature_map->add_sigpair();
			auto signature_pair = signature_pairs->Mutable(0);
			auto public_key = keyPairHedera->getPublicKey();

			auto sign = keyPairHedera->sign(body_bytes);
			if (!sign) {
				printf("[Query::sign] error signing message\n");
				return false;
			}
			signature_pair->set_pubkeyprefix(public_key, keyPairHedera->getPublicKeySize());
			signature_pair->set_ed25519(*sign, sign->size());

			mm->releaseMemory(sign);
			return true;
		}

		bool Transaction::sign(std::unique_ptr<KeyPairHedera> keyPairHedera, std::unique_ptr<TransactionBody> transactionBody)
		{
			mType = transactionBody->getType();

			auto mm = MemoryManager::getInstance();
			mConnection = transactionBody->getConnection();
			auto transaction_body_proto = transactionBody->getProtoTransactionBody();
			auto body_bytes = transaction_body_proto->SerializeAsString();
			mTransaction->set_bodybytes(body_bytes.data(), body_bytes.size());
			auto signature_map = mTransaction->mutable_sigmap();
			auto signature_pairs = signature_map->mutable_sigpair();
			signature_map->add_sigpair();
			auto signature_pair = signature_pairs->Mutable(0);
			auto public_key = keyPairHedera->getPublicKey();

			mTransactionId = transactionBody->getProtoTransactionBody()->transactionid();

			auto sign = keyPairHedera->sign(body_bytes);
			if (!sign) {
				printf("[Query::sign] error signing message\n");
				return false;
			}
			signature_pair->set_pubkeyprefix(public_key, keyPairHedera->getPublicKeySize());
			signature_pair->set_ed25519(*sign, sign->size());

			mm->releaseMemory(sign);
			return true;
		}
	}
}