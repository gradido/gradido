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
			auto target_group = mProtoMemberUpdate.target_group();
			auto sm = SessionManager::getInstance();
			auto mm = MemoryManager::getInstance();

			if (mProtoMemberUpdate.user_pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
				return -1;
			}

			auto pubkey_copy = mm->getFreeMemory(KeyPairEd25519::getPublicKeySize());
			memcpy(*pubkey_copy, mProtoMemberUpdate.user_pubkey().data(), KeyPairEd25519::getPublicKeySize());
			mRequiredSignPublicKeys.push_back(pubkey_copy);

			if (sm->isValid(target_group, VALIDATE_GROUP_ALIAS)) {
				auto groups = controller::Group::load(mProtoMemberUpdate.target_group());
				if (groups.size() > 0 && !groups[0].isNull() && groups[0]->getModel()) {
					auto user_db = controller::User::create();
					auto count = user_db->getModel()->countColumns("group_id", groups[0]->getModel()->getID());
					if (!count) 
					{
						// no current user in group, at least login server known, so we need only one signature for transaction
						// TODO: maybe check with node server, but maybe it isn't necessary
						// check sequence number in topic db entry, should be <= 1
						mMinSignatureCount = 1;
						
					}
					else 
					{
						// at least one more user is in group
						// now we need the voting system to decide how many and which signatures are needed

						// for current version we need only one another
						mMinSignatureCount = 2;
					}
				}
				/*if (groups.size() != 1) {
					addError(new ParamError(functionName, "target group not known or not unambiguous: ", target_group));
					return TRANSACTION_VALID_INVALID_GROUP_ALIAS;
				}*/
			}
			mIsPrepared = true;
			return 0;
		}

		TransactionValidation GroupMemberUpdate::validate()
		{
			const static char functionName[] = { "GroupMemberUpdate::validate" };
			if (mProtoMemberUpdate.user_pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
				addError(new Error(functionName, "pubkey not set or wrong size"));
				return TRANSCATION_VALID_INVALID_PUBKEY;
			}

			if (mProtoMemberUpdate.member_update_type() != proto::gradido::GroupMemberUpdate::ADD_USER) {
				addError(new Error(functionName, "user move not implemented yet!"));
				return TRANSACTION_VALID_CODE_ERROR;
			}
			auto target_group = mProtoMemberUpdate.target_group();
			auto sm = SessionManager::getInstance();
			if (sm->isValid(target_group, VALIDATE_GROUP_ALIAS)) {
				auto groups = controller::Group::load(mProtoMemberUpdate.target_group());
				if (groups.size() != 1) {
					addError(new ParamError(functionName, "target group not known or not unambiguous: ", target_group));
					return TRANSACTION_VALID_INVALID_GROUP_ALIAS;
				}
			}
			else {
				addError(new Error(functionName, "target group isn't valid group alias string "));
				return TRANSACTION_VALID_INVALID_GROUP_ALIAS;
			}

			return TRANSACTION_VALID_OK;
		}
		/*
		GroupMemberUpdate::GroupMemberUpdate(const std::string& memo, Poco::AutoPtr<controller::User> user, Poco::AutoPtr<controller::Group> group)
		{

		}
		*/

		std::string GroupMemberUpdate::getPublicKeyHex()
		{
			auto user_pubkey = mProtoMemberUpdate.user_pubkey();
			return DataTypeConverter::binToHex((const unsigned char*)user_pubkey.data(), user_pubkey.size());
		}

		void GroupMemberUpdate::transactionAccepted(Poco::AutoPtr<controller::User> user)
		{
			static const char* function_name = "GroupMemberUpdate::transactionAccepted";
			auto sm = SessionManager::getInstance();

			auto target_group = mProtoMemberUpdate.target_group();
			
			if (sm->isValid(target_group, VALIDATE_GROUP_ALIAS)) {
				auto groups = controller::Group::load(mProtoMemberUpdate.target_group());
				if (groups.size() != 1) {
					addError(new ParamError(function_name, "target group not known or not unambiguous: ", target_group));
					sendErrorsAsEmail();
				}
				else {
					auto user_model = user->getModel();
					auto group_model = groups[0]->getModel();
					// write new group_id in user table
					user_model->setGroupId(group_model->getID());
					user_model->updateIntoDB("group_id", group_model->getID());
					
					printf("[GroupMemberUpdate::transactionAccepted] finished\n");
				}
			}
			else {
				addError(new ParamError(function_name, "invalid group alias, after transaction was successfully sended: ", target_group));
				sendErrorsAsEmail();
			}
		}
	}
}