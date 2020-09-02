#include "Query.h"
#include "Poco/Timestamp.h"
#include "../../SingletonManager/MemoryManager.h"

namespace model {
	namespace hedera {

		Query::Query(const controller::NodeServerConnection& connection)
			: mConnection(connection)
		{

		}

		Query::~Query()
		{

		}

		Query* Query::getBalance(Poco::AutoPtr<controller::HederaId> accountId, const controller::NodeServerConnection& connection)
		{
		
			assert(!accountId.isNull() && accountId->getModel());

			auto query = new Query(connection);
			auto get_account_balance = query->mQueryProto.mutable_cryptogetaccountbalance();
			accountId->copyToProtoAccountId(get_account_balance->mutable_accountid());
			auto query_header = get_account_balance->mutable_header();
			query_header->set_responsetype(proto::COST_ANSWER);
			auto transaction = query_header->mutable_payment();
			//auto transaction_body = transaction->mutable_body();
			// body content
			//	transaction id
			auto transaction_id = query->mTransactionBody.mutable_transactionid();
			auto timestamp = transaction_id->mutable_transactionvalidstart();
			Poco::Timestamp now;
			auto microseconds = now.epochMicroseconds() - now.epochTime() * now.resolution(); // 1*10^6
			timestamp->set_seconds(now.epochTime());
			timestamp->set_nanos(microseconds * 1000);
			accountId->copyToProtoAccountId(transaction_id->mutable_accountid());
			//  
			// sdk default, but can be changed
			query->mTransactionBody.set_transactionfee(100000000);
			auto valid_duration = query->mTransactionBody.mutable_transactionvalidduration();
			// maximal 2 minutes
			valid_duration->set_seconds(120);
			auto crypto_transfer = query->mTransactionBody.mutable_cryptotransfer();
			auto transfer_list = crypto_transfer->mutable_transfers();
			auto account_amounts = transfer_list->mutable_accountamounts();
			account_amounts->Add();
			auto account_amount = account_amounts->Mutable(0);
			account_amount->set_amount(1000);
			connection.hederaId->copyToProtoAccountId(account_amount->mutable_accountid());

			return query;
		}

		bool Query::sign(std::unique_ptr<KeyPairHedera> keyPairHedera)
		{
			auto mm = MemoryManager::getInstance();
			auto body_bytes = mTransactionBody.SerializeAsString();
			auto transaction = mQueryProto.mutable_cryptogetaccountbalance()->mutable_header()->mutable_payment();
			transaction->set_bodybytes(body_bytes.data());
			auto signature_map = transaction->mutable_sigmap();
			auto signature_pairs = signature_map->mutable_sigpair();
			signature_pairs->Add();
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
	}
}