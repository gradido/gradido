#include "TransactionBody.h"


namespace model {
	namespace gradido {
	
		TransactionBody::TransactionBody()
			: mTransactionSpecific(nullptr), mType(TRANSACTION_NONE)
		{
		}

		TransactionBody::~TransactionBody()
		{
			lock("TransactionBody::~TransactionBody");
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

		Poco::AutoPtr<TransactionBody> TransactionBody::create(
			const std::string& memo, 
			Poco::AutoPtr<controller::User> sender, 
			const MemoryBin* receiverPublicKey, 
			Poco::UInt32 amount, 
			BlockchainType blockchainType,
			Poco::Timestamp pairedTransactionId, 
			Poco::AutoPtr<controller::Group> group/* = nullptr*/)
		{
			if (sender.isNull() || !sender->getModel()) {
				return nullptr;
			}
			auto sender_model = sender->getModel();
			

			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;
			obj->mTransactionBody.set_memo(memo);
			auto gradido_transfer = obj->mTransactionBody.mutable_transfer();
			proto::gradido::TransferAmount* transfer_amount = nullptr;
			std::string* receiver = nullptr;
			

			if (group.isNull()) 
			{
				auto local = gradido_transfer->mutable_local();
				transfer_amount = local->mutable_sender();
				receiver = local->mutable_receiver();
			} 
			else 
			{
				auto group_model = group->getModel();
				proto::gradido::CrossGroupTransfer* cross_group_transfer = nullptr;
				if (group->getModel()->getID() != sender->getModel()->getGroupId()) {
					cross_group_transfer = gradido_transfer->mutable_outbound();
				}
				else {
					cross_group_transfer = gradido_transfer->mutable_inbound();
				}
				transfer_amount = cross_group_transfer->mutable_sender();
				receiver = cross_group_transfer->mutable_receiver();
				auto paired_transaction_id = cross_group_transfer->mutable_paired_transaction_id();
				DataTypeConverter::convertToProtoTimestamp(pairedTransactionId, paired_transaction_id);
				cross_group_transfer->set_other_group(group_model->getAlias());
			}
			transfer_amount->set_amount(amount);
			transfer_amount->set_pubkey(sender_model->getPublicKey(), sender_model->getPublicKeySize());
			*receiver = std::string((const char*)receiverPublicKey->data(), receiverPublicKey->size());

			obj->mType = TRANSACTION_TRANSFER;
			obj->mBlockchainType = blockchainType;
			obj->mTransactionSpecific = new TransactionTransfer(memo, obj->mTransactionBody.transfer());
			obj->mTransactionSpecific->prepare();

			return obj;
		}

		Poco::AutoPtr<TransactionBody> TransactionBody::create(const std::string& memo, const MemoryBin* senderPublicKey, Poco::AutoPtr<controller::User> receiver, Poco::UInt32 amount, Poco::Timestamp pairedTransactionId /*= Poco::Timestamp()*/, Poco::AutoPtr<controller::Group> group/* = nullptr*/)
		{
			if (receiver.isNull() || !receiver->getModel()) {
				return nullptr;
			}
			auto receiver_model = receiver->getModel();


			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;
			obj->mTransactionBody.set_memo(memo);
			auto gradido_transfer = obj->mTransactionBody.mutable_transfer();
			proto::gradido::TransferAmount* transfer_amount = nullptr;
			std::string* sender = nullptr;

			auto group_model = group->getModel();
			proto::gradido::CrossGroupTransfer* cross_group_transfer = nullptr;

			cross_group_transfer = gradido_transfer->mutable_inbound();
			
			transfer_amount = cross_group_transfer->mutable_sender();
			sender = transfer_amount->mutable_pubkey();
			auto paired_transaction_id = cross_group_transfer->mutable_paired_transaction_id();
			DataTypeConverter::convertToProtoTimestamp(pairedTransactionId, paired_transaction_id);
			cross_group_transfer->set_other_group(group_model->getAlias());
			
			transfer_amount->set_amount(amount);
			transfer_amount->set_pubkey(senderPublicKey, KeyPairEd25519::getPublicKeySize());
			cross_group_transfer->set_receiver(receiver_model->getPublicKey(), receiver_model->getPublicKeySize());
			*sender = std::string((const char*)senderPublicKey->data(), senderPublicKey->size());

			obj->mType = TRANSACTION_TRANSFER;
			obj->mTransactionSpecific = new TransactionTransfer(memo, obj->mTransactionBody.transfer());
			obj->mTransactionSpecific->prepare();

			return obj;
		}

		Poco::AutoPtr<TransactionBody> TransactionBody::create(const std::string& memo, const MemoryBin* senderPublicKey, const MemoryBin* receiverPublicKey, Poco::UInt32 amount, const std::string groupAlias, TransactionTransferType transferType, Poco::Timestamp pairedTransactionId/* = Poco::Timestamp()*/)
		{
			assert(transferType == TRANSFER_CROSS_GROUP_INBOUND || transferType == TRANSFER_CROSS_GROUP_OUTBOUND || transferType == TRANSFER_LOCAL);
			if (!senderPublicKey || !receiverPublicKey) {
				return nullptr;
			}

			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;
			obj->mTransactionBody.set_memo(memo);
			auto gradido_transfer = obj->mTransactionBody.mutable_transfer();
			proto::gradido::TransferAmount* transfer_amount = nullptr;
			proto::gradido::CrossGroupTransfer* cross_group_transfer = nullptr;
			proto::gradido::LocalTransfer* local_transfer = nullptr;

			switch (transferType)
			{
			case TRANSFER_CROSS_GROUP_INBOUND:
				cross_group_transfer = gradido_transfer->mutable_inbound();
				break;
			case TRANSFER_CROSS_GROUP_OUTBOUND:
				cross_group_transfer = gradido_transfer->mutable_outbound();
				break;
			case TRANSFER_LOCAL:
				local_transfer = gradido_transfer->mutable_local();
				break;			
			}


			if (local_transfer) {
				transfer_amount = local_transfer->mutable_sender();
				local_transfer->set_receiver((const char*)receiverPublicKey->data(), receiverPublicKey->size());
			}
			else if (cross_group_transfer) {
				transfer_amount = cross_group_transfer->mutable_sender();
				auto paired_transaction_id = cross_group_transfer->mutable_paired_transaction_id();
				DataTypeConverter::convertToProtoTimestamp(pairedTransactionId, paired_transaction_id);
				cross_group_transfer->set_other_group(groupAlias);

				cross_group_transfer->set_receiver((const char*)receiverPublicKey->data(), receiverPublicKey->size());
			}
			

			transfer_amount->set_amount(amount);
			transfer_amount->set_pubkey((const unsigned char*)senderPublicKey->data(), senderPublicKey->size());

			obj->mType = TRANSACTION_TRANSFER;
			obj->mTransactionSpecific = new TransactionTransfer(memo, obj->mTransactionBody.transfer());
			obj->mTransactionSpecific->prepare();

			return obj;
		}

		Poco::AutoPtr<TransactionBody> TransactionBody::create(
			const std::string& memo, 
			Poco::AutoPtr<controller::User> receiver, 
			Poco::UInt32 amount, 
			Poco::DateTime targetDate,
			BlockchainType blockchainType
			)
		{
			if (receiver.isNull() || !receiver->getModel()) {
				return nullptr;
			}
			auto receiver_model = receiver->getModel();

			Poco::AutoPtr<TransactionBody> obj = new TransactionBody;
			obj->mTransactionBody.set_memo(memo);

			auto creation = obj->mTransactionBody.mutable_creation();
			auto target_date_timestamp_seconds = creation->mutable_target_date();
			target_date_timestamp_seconds->set_seconds(targetDate.timestamp().epochTime());

			auto transfer_amount = creation->mutable_receiver();
			transfer_amount->set_amount(amount);
			std::string* pubkey_str = transfer_amount->mutable_pubkey();
			*pubkey_str = std::string((const char*)receiver_model->getPublicKey(), receiver_model->getPublicKeySize());

			obj->mType = TRANSACTION_CREATION;
			obj->mTransactionSpecific = new TransactionCreation(memo, obj->mTransactionBody.creation());
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

		const char* TransactionBody::transactionTypeToString(TransactionType type)
		{
			switch (type)
			{
			case model::gradido::TRANSACTION_NONE: return "NONE";
			case model::gradido::TRANSACTION_CREATION: return "Creation";
			case model::gradido::TRANSACTION_TRANSFER: return "Transfer";
			case model::gradido::TRANSACTION_GROUP_MEMBER_UPDATE: return "Group Member Update";
			}
			return "<unknown>";
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

		BlockchainType TransactionBody::blockchainTypeFromString(const std::string& blockainTypeString)
		{
			if (blockainTypeString == "db" || blockainTypeString == "mysql" || blockainTypeString == "mariadb") {
				return BLOCKCHAIN_MYSQL;
			}
			else if (blockainTypeString == "hedera") {
				return BLOCKCHAIN_HEDERA;
			}
			return BLOCKCHAIN_UNKNOWN;
		}
	}
}