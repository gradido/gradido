#include "GroupMemberUpdate.h"
#include "../../Crypto/KeyPairEd25519.h"
#include "../../controller/Group.h"
#include "../../SingletonManager/SessionManager.h"

namespace model {
	namespace gradido {
		GroupMemberUpdate::GroupMemberUpdate(const std::string& memo, const proto::gradido::GroupMemberUpdate &protoGroupMemberUpdate)
			: TransactionBase(memo), mProtoMemberUpdate(protoGroupMemberUpdate)
		{

		}

		GroupMemberUpdate::~GroupMemberUpdate()
		{

		}

		int GroupMemberUpdate::prepare()
		{
			const static char functionName[] = { "GroupMemberUpdate::prepare" };
			if (mProtoMemberUpdate.user_pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new Error(functionName, "pubkey not set or wrong size"));
				return -1;
			}

			if (mProtoMemberUpdate.member_update_type() != proto::gradido::GroupMemberUpdate::ADD_USER) {
				addError(new Error(functionName, "user move not implemented yet!"));
				return 1;
			}
			auto target_group = mProtoMemberUpdate.target_group();
			auto sm = SessionManager::getInstance();
			if (sm->isValid(target_group, VALIDATE_GROUP_ALIAS)) {
				auto groups = controller::Group::load(mProtoMemberUpdate.target_group());
				if (groups.size() != 1) {
					addError(new ParamError(functionName, "target group not known or not unambiguous: ", target_group));
					return -2;
				}
			}
			else {
				addError(new Error(functionName, "target group isn't valid group alias string "));
				return -3;
			}

			return 0;
		}
	}
}