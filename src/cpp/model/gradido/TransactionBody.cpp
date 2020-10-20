#include "TransactionBody.h"


namespace model {
	namespace gradido {
	
		TransactionBody::TransactionBody()
			: mTransactionSpecific(nullptr), mType(TRANSACTION_NONE)
		{
		}

		TransactionBody::~TransactionBody()
		{
			lock();
			if (mTransactionSpecific) {
				delete mTransactionSpecific;
				mTransactionSpecific = nullptr;
			}
			unlock();
		}

		Poco::AutoPtr<TransactionBody> TransactionBody::create(const std::string& memo, Poco::AutoPtr<controller::User> user, proto::gradido::GroupMemberUpdate_MemberUpdateType type, const std::string& targetGroupAlias)
		{
			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;
			obj->mTransactionBody.set_memo(memo);
			auto group_member_update = obj->mTransactionBody.mutable_group_member_update();

			group_member_update->set_user_pubkey(user->getModel()->getPublicKey(), KeyPairEd25519::getPublicKeySize());
			group_member_update->set_member_update_type(type);
			group_member_update->set_target_group(targetGroupAlias);

			obj->mType = TRANSACTION_GROUP_MEMBER_UPDATE;
			obj->mTransactionSpecific = new GroupMemberUpdate(memo, obj->mTransactionBody.group_member_update());
			obj->mTransactionSpecific->prepare();

			return obj;
		}

		Poco::AutoPtr<TransactionBody> TransactionBody::load(const std::string& protoMessageBin)
		{
			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;

			if (!obj->mTransactionBody.ParseFromString(protoMessageBin)) {
				return nullptr;
			}

			// check Type
			if (obj->mTransactionBody.has_creation()) {
				obj->mType = TRANSACTION_CREATION;
				obj->mTransactionSpecific = new model::gradido::TransactionCreation(obj->mTransactionBody.memo(), obj->mTransactionBody.creation());
			}
			else if (obj->mTransactionBody.has_transfer()) {
				obj->mType = TRANSACTION_TRANSFER;
				obj->mTransactionSpecific = new model::gradido::TransactionTransfer(obj->mTransactionBody.memo(), obj->mTransactionBody.transfer());
			}
			else if (obj->mTransactionBody.has_group_member_update()) {
				obj->mType = TRANSACTION_GROUP_MEMBER_UPDATE;
				obj->mTransactionSpecific = new model::gradido::GroupMemberUpdate(obj->mTransactionBody.memo(), obj->mTransactionBody.group_member_update());
			}
			obj->mTransactionSpecific->prepare();
			return obj;
		}


		std::string TransactionBody::getMemo()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mTransactionBody.IsInitialized()) {
				std::string result(mTransactionBody.memo());
				
				return result;
			}
			return "<uninitalized>";
		}

		void TransactionBody::setMemo(const std::string& memo)
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			mTransactionBody.set_memo(memo);
		}

		std::string TransactionBody::getBodyBytes()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mTransactionBody.IsInitialized()) {
				auto size = mTransactionBody.ByteSize();
				//auto bodyBytesSize = MemoryManager::getInstance()->getFreeMemory(mProtoCreation.ByteSizeLong());
				std::string resultString(size, 0);
				if (!mTransactionBody.SerializeToString(&resultString)) {
					//addError(new Error("TransactionCreation::getBodyBytes", "error serializing string"));
					throw new Poco::Exception("error serializing string");
				}

				return resultString;
			}

			return "<uninitalized>";
		}

		

		TransactionCreation* TransactionBody::getCreationTransaction()
		{
			return dynamic_cast<TransactionCreation*>(mTransactionSpecific);
		}

		TransactionTransfer* TransactionBody::getTransferTransaction()
		{
			return dynamic_cast<TransactionTransfer*>(mTransactionSpecific);
		}

		GroupMemberUpdate*  TransactionBody::getGroupMemberUpdate()
		{
			return dynamic_cast<GroupMemberUpdate*>(mTransactionSpecific);
		}

		TransactionBase*  TransactionBody::getTransactionBase()
		{
			return mTransactionSpecific;
		}
	}
}