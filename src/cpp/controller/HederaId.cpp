#include "HederaId.h"

namespace controller {

	HederaId::HederaId(model::table::HederaId* dbModel)
	{
		mDBModel = dbModel;
	}

	HederaId::~HederaId()
	{

	}

	Poco::AutoPtr<HederaId> HederaId::create(Poco::UInt64 shardNum, Poco::UInt64 realmNum, Poco::UInt64 num)
	{
		auto db = new model::table::HederaId(shardNum, realmNum, num);

		auto hedera_id = new HederaId(db);
		return Poco::AutoPtr<HederaId>(hedera_id);
	}

	Poco::AutoPtr<HederaId> HederaId::load(int id)
	{
		auto db = new model::table::HederaId();
		if (1 == db->loadFromDB("id", id)) {
			auto cryptoKey = new HederaId(db);
			return Poco::AutoPtr<HederaId>(cryptoKey);
		}
		return nullptr;
	}

	void HederaId::copyToProtoAccountId(proto::AccountID* protoAccountId) const
	{
		auto model = getModel();
		protoAccountId->set_shardnum(model->getShardNum());
		protoAccountId->set_realmnum(model->getRealmNum());
		protoAccountId->set_accountnum(model->getNum());
	}

	bool HederaId::isExistInDB()
	{
		auto model = getModel();
		if (model->getID() > 0) return true;
		//std::vector<Tuple> loadFromDB(const std::vector<std::string>& fieldNames, const std::vector<WhereFieldType>& fieldValues, MysqlConditionType conditionType = MYSQL_CONDITION_AND, int expectedResults = 0);
		model->isExistInDB();
		return model->getID() != 0;

	}
}