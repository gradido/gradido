#ifndef __GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_GROUP_MEMBER_UPDATE_H
#define __GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_GROUP_MEMBER_UPDATE_H

#include "TransactionBase.h"
#include "proto/gradido/GroupMemberUpdate.pb.h"


namespace model {
	namespace gradido {
		class GroupMemberUpdate : public TransactionBase
		{
		public:
			GroupMemberUpdate(const std::string& memo, const proto::gradido::GroupMemberUpdate &protoGroupMemberUpdate);
			~GroupMemberUpdate();
			int prepare();
			TransactionValidation validate();

			std::string getTargetGroupAlias() { return mProtoMemberUpdate.target_group(); }
			std::string getPublicKeyHex();

			void transactionAccepted(Poco::AutoPtr<controller::User>);

		protected:
			const proto::gradido::GroupMemberUpdate& mProtoMemberUpdate;
		};
	}
}

#endif
