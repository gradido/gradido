#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE

#include "../model/table/HederaId.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {
	class HederaId : public TableControllerBase
	{
	public:

		~HederaId();

		static Poco::AutoPtr<HederaId> create(Poco::UInt64 shardNum, Poco::UInt64 realmNum, Poco::UInt64 num);

		static Poco::AutoPtr<HederaId> load(int id);

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::HederaId> getModel() { return _getModel<model::table::HederaId>(); }


	protected:
		HederaId(model::table::HederaId* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE