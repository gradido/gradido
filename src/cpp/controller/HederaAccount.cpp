
#include "HederaAccount.h"
#include "NodeServer.h"
#include "CryptoKey.h"
#include "../model/hedera/Query.h"
//#include "../model/hedera/Tr"
#include "HederaRequest.h"

#include "../SingletonManager/ErrorManager.h"

using namespace Poco::Data::Keywords;

namespace controller {

	HederaAccount::HederaAccount(model::table::HederaAccount* dbModel)
	{
		mDBModel = dbModel;
	}

	HederaAccount::~HederaAccount()
	{

	}

	Poco::AutoPtr<HederaAccount> HederaAccount::create(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance/* = 0*/, model::table::HederaNetworkType type/* = HEDERA_MAINNET*/)
	{
		auto db = new model::table::HederaAccount(user_id, account_hedera_id, account_key_id, balance, type);
		auto group = new HederaAccount(db);
		return Poco::AutoPtr<HederaAccount>(group);
	}

	std::vector<Poco::AutoPtr<HederaAccount>> HederaAccount::load(const std::string& fieldName, int fieldValue)
	{
		auto db = new model::table::HederaAccount();
		auto hedera_account_list = db->loadFromDB<int, model::table::HederaAccountTuple>(fieldName, fieldValue, 2);
		std::vector<Poco::AutoPtr<HederaAccount>> resultVector;
		resultVector.reserve(hedera_account_list.size());
		for (auto it = hedera_account_list.begin(); it != hedera_account_list.end(); it++) {
			//mHederaID
			auto db = new model::table::HederaAccount(*it);
			auto hedera_account = new HederaAccount(db);
			hedera_account->mHederaID = HederaId::load(db->getAccountHederaId());
			resultVector.push_back(hedera_account);
		}
		return resultVector;
	}

	Poco::AutoPtr<HederaAccount> HederaAccount::load(Poco::AutoPtr<controller::HederaId> hederaId)
	{
		if (!hederaId->isExistInDB()) return nullptr;

		auto db = new model::table::HederaAccount();
		auto result_count = db->loadFromDB("account_hedera_id", hederaId->getModel()->getID());
		if (1 == result_count) {
			return new HederaAccount(db);
		}
		// maybe change later to using error manager and send email
		printf("[HederaAccount::load] result_count not expected: %d\n", result_count);
		return nullptr;
	}

	Poco::AutoPtr<HederaAccount> HederaAccount::pick(model::table::HederaNetworkType networkType, bool encrypted/* = false*/)
	{
		auto cm = ConnectionManager::getInstance();
		auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement select(session);

		Poco::Tuple<int, int, int, int, Poco::UInt64, Poco::UInt64, Poco::UInt64, Poco::UInt64> result_tuple;
		int crypto_key_type = encrypted ? model::table::KEY_TYPE_ED25519_HEDERA_ENCRYPTED : model::table::KEY_TYPE_ED25519_HEDERA_CLEAR;
		int network_type_int = (int)networkType;

		select
			<< "SELECT account.id, account.user_id, account.account_hedera_id, account.account_key_id, account.balance, i.shardNum, i.realmNum, i.num "
			<< "FROM hedera_accounts as account "
			<< "JOIN hedera_ids as i ON(i.id = account_hedera_id) "
			<< "JOIN crypto_keys as k ON(k.id = account.account_key_id) "
			<< "WHERE account.network_type = ? "
			<< "AND k.crypto_key_type_id = ? "
			<< "ORDER BY RAND() LIMIT 1 "
			, into(result_tuple), use(network_type_int) , use(crypto_key_type);

		try {
			select.executeAsync();
			select.wait();
			auto result_count = select.rowsExtracted();
			if (1 == result_count) {
				auto db = new model::table::HederaAccount(
					result_tuple.get<1>(), result_tuple.get<2>(), result_tuple.get<3>(),
					result_tuple.get<4>(), networkType
				);
				db->setID(result_tuple.get<0>());
				Poco::AutoPtr<HederaAccount> hedera_account(new HederaAccount(db));
				auto hedera_id_db = new model::table::HederaId(result_tuple.get<5>(), result_tuple.get<6>(), result_tuple.get<7>());
				Poco::AutoPtr<HederaId> hedera_id(new HederaId(hedera_id_db));
				hedera_account->setHederaId(hedera_id);
				return hedera_account;
			}
			else if(result_count > 1) {
				printf("[HederaAccount::pick] extracted rows not like expected\n");
			}
		}
		catch (Poco::Exception& ex) {
			auto em = ErrorManager::getInstance();
			static const char* function_name = "HederaAccount::pick";
			printf("exception: %s\n", ex.displayText().data());
			em->addError(new ParamError(function_name, "mysql error: ", ex.displayText()));
			em->addError(new ParamError(function_name, "network type: ", networkType));
			em->addError(new ParamError(function_name, "encrypted: ", (int)encrypted));
			em->sendErrorsAsEmail();
		}

		return nullptr;

	}

	std::vector<Poco::AutoPtr<HederaAccount>> HederaAccount::listAll()
	{
		auto db = new model::table::HederaAccount();
		std::vector<model::table::HederaAccountTuple> group_list;
		// throw an unresolved external symbol error
		group_list = db->loadAllFromDB<model::table::HederaAccountTuple>();

		// work around for not working call to loadAllFromDB
		/*auto cm = ConnectionManager::getInstance();

		Poco::Data::Statement select(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

		select << "SELECT id, alias, name, url, description FROM " << db->getTableName()
			, Poco::Data::Keywords::into(group_list);

		size_t resultCount = 0;
		try {
			resultCount = select.execute();
		}
		catch (Poco::Exception& ex) {
			printf("[Group::listAll] poco exception: %s\n", ex.displayText().data());
		}
		//*/ //work around end
		std::vector<Poco::AutoPtr<HederaAccount>> resultVector;

		resultVector.reserve(group_list.size());
		for (auto it = group_list.begin(); it != group_list.end(); it++) {
			Poco::AutoPtr<HederaAccount> group_ptr(new HederaAccount(new model::table::HederaAccount(*it)));
			resultVector.push_back(group_ptr);
		}
		return resultVector;
	}

	Poco::AutoPtr<controller::CryptoKey> HederaAccount::getCryptoKey() const
	{
		auto model = getModel();
		return controller::CryptoKey::load(model->getCryptoKeyId());
	}

	bool HederaAccount::hederaAccountGetBalance(Poco::AutoPtr<controller::User> user)
	{
		static const char* functionName = "HederaAccount::updateBalanceFromHedera";

		if (user.isNull() || !user->getModel()) {
			printf("[%s] invalid user\n", functionName);
			return false;
		}

		auto account_model = getModel();
		auto hedera_node = NodeServer::pick(account_model->networkTypeToNodeServerType(account_model->getNetworkType()));
		auto crypto_key = controller::CryptoKey::load(account_model->getCryptoKeyId());
		if (crypto_key.isNull()) {
			addError(new Error("Keys", "could not found crypto key for account"));
			printf("[%s] error, crypto key with id: %d not found\n", functionName, account_model->getCryptoKeyId()); 
			return false;
		}
		auto hedera_key_pair = crypto_key->getKeyPair(user);
		if (!hedera_key_pair) {
			addError(new Error("Keys", "error decrypting private key"));
			printf("[%s] error decrypting private key with id: %d, with user: %d\n", functionName, account_model->getCryptoKeyId(), user->getModel()->getID());
			return false;
		}
		
		auto query = model::hedera::Query::getBalance(mHederaID, hedera_node);

		if (!query) {
			printf("[%s] error creating query\n", functionName);
		}
		query->sign(std::move(hedera_key_pair));

		HederaRequest request;
		model::hedera::Response response;
		try {
			if (HEDERA_REQUEST_RETURN_OK == request.request(query, &response) && proto::OK == response.getResponseCode()) {
				account_model->updateIntoDB("balance", response.getAccountBalance());
			}
			else {
				addError(new Error("Hedera", "Hedera request failed"));
				addError(new ParamError("Hedera", "Hedera Response Code", proto::ResponseCodeEnum_Name(response.getResponseCode())));
			}
			//request.requestViaPHPRelay(query);
		}
		catch (Poco::Exception& ex) {
			printf("[HederaAccount::updateBalanceFromHedera] exception calling hedera request: %s\n", ex.displayText().data());
		}

		if (0 == errorCount() && 0 == request.errorCount()) {
			return true;
		}
		getErrors(&request);	
		
		return false;
	}

	bool HederaAccount::hederaAccountCreate(int autoRenewPeriodSeconds, double initialBalance)
	{
		auto account_model = getModel();
		auto new_key_pair = KeyPairHedera::create();
		auto transaction_body = createTransactionBody();
		//CryptoCreateTransaction(const unsigned char* publicKey, Poco::UInt64 initialBalance, int autoRenewPeriod);
		model::hedera::CryptoCreateTransaction create_transaction(new_key_pair->getPublicKey(), initialBalance, autoRenewPeriodSeconds);
		transaction_body->setCryptoCreate(create_transaction);


		return false;
	}

	bool HederaAccount::changeEncryption(Poco::AutoPtr<controller::User> user)
	{
		assert(!user.isNull() && user->getModel());
		auto model = getModel();
		assert(!model.isNull());

		if (user->getModel()->getID() != model->getUserId()) {
			addError(new Error("Hedera Account", "wrong user"));			
			return false;
		}
		auto crypto_key = controller::CryptoKey::load(model->getCryptoKeyId());
		if (crypto_key.isNull()) {
			addError(new Error("Hedera Account", "couldn't find crypto key"));
			return false;
		}
		bool result = crypto_key->changeEncryption(user);
		getErrors(crypto_key);
		return result;

	}

	std::unique_ptr<model::hedera::TransactionBody> HederaAccount::createTransactionBody()
	{
		auto account_model = getModel();		
		auto hedera_node = NodeServer::pick(account_model->networkTypeToNodeServerType(account_model->getNetworkType()));
		return std::make_unique<model::hedera::TransactionBody>(mHederaID, hedera_node);
	}


	std::string HederaAccount::toShortSelectOptionName()
	{
		std::stringstream ss;
		auto model = getModel();
		ss << model::table::HederaAccount::hederaNetworkTypeToString((model::table::HederaNetworkType)model->getNetworkType()) << " ";
		ss << mHederaID->getModel()->toString() << " " << ((double)model->getBalance() / 100000000.0) << " Hbar";
		return ss.str();
	}

}

