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
}