#ifndef GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_BASE_H
#define GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_BASE_H

#include "../../controller/User.h"
#include "GroupMemberUpdate.h"
#include "TransactionCreation.h"
#include "TransactionTransfer.h"

#include "../../proto/gradido/TransactionBody.pb.h"

#include "../../lib/MultithreadContainer.h"

namespace model {
	namespace gradido {

		enum TransactionType {
			TRANSACTION_NONE,
			TRANSACTION_CREATION,
			TRANSACTION_TRANSFER,
			TRANSACTION_GROUP_MEMBER_UPDATE
		};


		class TransactionBody : public Poco::RefCountedObject, UniLib::lib::MultithreadContainer
		{
		public:
			~TransactionBody();

			static Poco::AutoPtr<TransactionBody> create(const std::string& memo, Poco::AutoPtr<controller::User> user, proto::gradido::GroupMemberUpdate_MemberUpdateType type, const std::string& targetGroupAlias);
			static Poco::AutoPtr<TransactionBody> create(const MemoryBin* protoMessageBin);

			inline TransactionType getType() { lock(); auto t = mType; unlock(); return t; }
			std::string getMemo();

			
			bool isCreation() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mType == TRANSACTION_CREATION; }
			bool isTransfer() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mType == TRANSACTION_TRANSFER; }
			bool isGroupMemberUpdate() { Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex); return mType == TRANSACTION_GROUP_MEMBER_UPDATE; }

			std::string getBodyBytes();

			TransactionCreation* getCreationTransaction();
			TransactionTransfer* getTransferTransaction();
			GroupMemberUpdate*   getGroupMemberUpdate();
			TransactionBase*     getTransactionBase();

		protected:
			TransactionBody();
			proto::gradido::TransactionBody mTransactionBody;
			TransactionBase* mTransactionSpecific;
			TransactionType mType;
		};
	}
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_TRANSACTION_BASE_H