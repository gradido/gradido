
#include "HederaAccount.h"
#include "NodeServer.h"
#include "CryptoKey.h"
#include "../model/hedera/Query.h"
#include "HederaRequest.h"

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

		getErrors(&request);		
		
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


	std::string HederaAccount::toShortSelectOptionName()
	{
		std::stringstream ss;
		auto model = getModel();
		ss << model::table::HederaAccount::hederaNetworkTypeToString((model::table::HederaNetworkType)model->getNetworkType()) << " ";
		ss << mHederaID->getModel()->toString() << " " << ((double)model->getBalance() / 100000000.0) << " Hbar";
		return ss.str();
	}

}

