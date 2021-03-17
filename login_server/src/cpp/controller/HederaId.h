#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE

#include "../model/table/HederaId.h"
#include "../model/table/HederaAccount.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

#include "../proto/hedera/BasicTypes.pb.h"

namespace controller {
	class HederaAccount;
	class HederaId : public TableControllerBase
	{
		friend HederaAccount;
	public:

		~HederaId();

		static Poco::AutoPtr<HederaId> create(Poco::UInt64 shardNum, Poco::UInt64 realmNum, Poco::UInt64 num);
		static Poco::AutoPtr<HederaId> create(std::string hederaIdString);

		static Poco::AutoPtr<HederaId> load(int id);
		//! \return hedera topic id for group and network type (should exist only one)
		static Poco::AutoPtr<HederaId> find(int groupId, ServerConfig::HederaNetworkType networkType);

		bool isExistInDB();

		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::HederaId> getModel() { return _getModel<model::table::HederaId>(); }
		inline const model::table::HederaId* getModel() const { return _getModel<model::table::HederaId>(); }

		void copyToProtoAccountId(proto::AccountID* protoAccountId) const;
		void copyToProtoTopicId(proto::TopicID* protoTopicId) const;


	protected:
		HederaId(model::table::HederaId* dbModel);

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_HEDERA_ID_INCLUDE