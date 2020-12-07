#include "Transaction.h"
#include "../../SingletonManager/ErrorManager.h"
#include "../../SingletonManager/PendingTasksManager.h"
#include "../../SingletonManager/LanguageManager.h"
#include "../../SingletonManager/CronManager.h"
#include "../../ServerConfig.h"

#include "../../controller/HederaId.h"
#include "../../controller/HederaAccount.h"
#include "../../controller/HederaRequest.h"

#include "../hedera/Transaction.h"

#include "../../tasks/HederaTask.h"

#include <google/protobuf/util/json_util.h>

#include <inttypes.h>


namespace model {
	namespace gradido {
		Transaction::Transaction(Poco::AutoPtr<TransactionBody> body)
			: mTransactionBody(body), mBodyBytesHash(0)
		{
			
			auto body_bytes = mTransactionBody->getBodyBytes();
			mBodyBytesHash = DRMakeStringHash(body_bytes.data(), body_bytes.size());
			mProtoTransaction.set_body_bytes(body_bytes);
		}

		Transaction::Transaction(const std::string& protoMessageBin, model::table::PendingTask* dbModel)
			: GradidoTask(dbModel)
		{
			if (!mProtoTransaction.ParseFromString(protoMessageBin)) {
				throw new Poco::Exception("error parse from string");
			}
			mTransactionBody = TransactionBody::load(mProtoTransaction.body_bytes());
			auto body_bytes = mTransactionBody->getBodyBytes();
			mBodyBytesHash = DRMakeStringHash(body_bytes.data(), body_bytes.size());
		}
	
		Transaction::~Transaction()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
		}

		Poco::AutoPtr<Transaction> Transaction::createGroupMemberUpdate(Poco::AutoPtr<controller::User> user, Poco::AutoPtr<controller::Group> group)
		{
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create group member update";

			if (user.isNull() || !user->getModel() || group.isNull() || !group->getModel()) {
				return nullptr;
			}
			auto group_model = group->getModel();
			auto network_type = ServerConfig::g_HederaNetworkType;
			auto topic_id = controller::HederaId::find(group_model->getID(), network_type);

			if (topic_id.isNull()) {
				em->addError(new ParamError(function_name, "could'n find topic for group: ", group_model->getID()));
				em->addError(new ParamError(function_name, "network type: ", network_type));
				em->sendErrorsAsEmail();
				return nullptr;
			}

			auto body = TransactionBody::create("", user, proto::gradido::GroupMemberUpdate_MemberUpdateType_ADD_USER, group_model->getAlias());
			
			Poco::AutoPtr<Transaction> result = new Transaction(body);
			auto model = result->getModel();
			model->setHederaId(topic_id->getModel()->getID());
			result->insertPendingTaskIntoDB(user, model::table::TASK_TYPE_GROUP_ADD_MEMBER);
			PendingTasksManager::getInstance()->addTask(result);
			return result;
		}

		Poco::AutoPtr<Transaction> Transaction::createCreation(Poco::AutoPtr<controller::User> receiver, Poco::UInt32 amount, Poco::DateTime targetDate, const std::string& memo)
		{
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create creation";

			if (receiver.isNull() || !receiver->getModel()) {
				return nullptr;
			}
			auto network_type = ServerConfig::g_HederaNetworkType;
			auto receiver_model = receiver->getModel();
			auto topic_id = controller::HederaId::find(receiver_model->getGroupId(), network_type);

			if (topic_id.isNull()) {
				em->addError(new ParamError(function_name, "could'n find topic for group: ", receiver_model->getGroupId()));
				em->addError(new ParamError(function_name, "network type: ", network_type));
				em->sendErrorsAsEmail();
				return nullptr;
			}
			auto body = TransactionBody::create(memo, receiver, amount, targetDate);
			Poco::AutoPtr<Transaction> result = new Transaction(body);
			auto model = result->getModel();
			model->setHederaId(topic_id->getModel()->getID());
			result->insertPendingTaskIntoDB(receiver, model::table::TASK_TYPE_CREATION);
			PendingTasksManager::getInstance()->addTask(result);
			return result;
		}

		std::vector<Poco::AutoPtr<Transaction>> Transaction::createTransfer(Poco::AutoPtr<controller::User> sender, const MemoryBin* receiverPubkey, Poco::AutoPtr<controller::Group> receiverGroup, Poco::UInt32 amount, const std::string& memo)
		{
			std::vector<Poco::AutoPtr<Transaction>> results;
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create transfer";

			if (sender.isNull() || !sender->getModel() || !receiverPubkey || !amount) {
				return results;
			}
			
			//std::vector<Poco::AutoPtr<TransactionBody>> bodys;
			auto sender_model = sender->getModel();
			auto network_type = ServerConfig::g_HederaNetworkType;
			// LOCAL Transfer
			if (receiverGroup.isNull() ||  sender_model->getGroupId() == receiverGroup->getModel()->getID())
			{	
				auto body = TransactionBody::create(memo, sender, receiverPubkey, amount);
				Poco::AutoPtr<Transaction> transaction = new Transaction(body);
				auto topic_id = controller::HederaId::find(sender_model->getGroupId(), network_type);
				if (topic_id.isNull()) {
					em->addError(new ParamError(function_name, "could'n find topic for group: ", sender_model->getGroupId()));
					em->addError(new ParamError(function_name, "network type: ", network_type));
					em->sendErrorsAsEmail();
					return results;
				}
				transaction->getModel()->setHederaId(topic_id->getModel()->getID());
				results.push_back(transaction);
			}
			else 
			{
				auto sender_group = controller::Group::load(sender_model->getGroupId());
				Poco::AutoPtr<controller::Group> transaction_group;
				Poco::AutoPtr<controller::Group> topic_group;
				// default constructor set it to now
				Poco::Timestamp pairedTransactionId;
				for (int i = 0; i < 2; i++) {
					if (0 == i) {
						transaction_group = receiverGroup;
						topic_group = sender_group;
					}
					else {
						transaction_group = sender_group;
						topic_group = receiverGroup;
					}
					auto topic_id = controller::HederaId::find(topic_group->getModel()->getID(), network_type);
					if (topic_id.isNull()) {
						em->addError(new ParamError(function_name, "could'n find topic for group: ", sender_model->getGroupId()));
						em->addError(new ParamError(function_name, "network type: ", network_type));
						em->sendErrorsAsEmail();
						return results;
					}
					if (transaction_group.isNull()) {
						em->addError(new ParamError(function_name, "transaction group is zero, i:", i));
						em->sendErrorsAsEmail();
						return results;
					}

					auto body = TransactionBody::create(memo, sender, receiverPubkey, amount, pairedTransactionId, transaction_group);
					Poco::AutoPtr<Transaction> transaction = new Transaction(body);
					transaction->getModel()->setHederaId(topic_id->getModel()->getID());
					results.push_back(transaction);
				}
			}
			for (auto it = results.begin(); it != results.end(); it++) {
				(*it)->insertPendingTaskIntoDB(sender, model::table::TASK_TYPE_TRANSFER);
				PendingTasksManager::getInstance()->addTask(*it);
			}
			return results;

		}

		

		Poco::AutoPtr<Transaction> Transaction::load(model::table::PendingTask* dbModel)
		{
			proto::gradido::GradidoTransaction transaction_temp;

			Poco::AutoPtr<Transaction> transaction = new Transaction(dbModel->getRequestCopy(), dbModel);
			PendingTasksManager::getInstance()->addTask(transaction);
			return transaction;
		}
		
		bool Transaction::insertPendingTaskIntoDB(Poco::AutoPtr<controller::User> user, model::table::TaskType type)
		{
			static const char* function_name = "Transaction::insertPendingTaskIntoDB";
			auto model = getModel();
			if (model->getID()) {
				addError(new Error("Transaction::insertPendingTaskIntoDB", "pending task already inserted into db"));
				return false;
			}
			if (user.isNull() || !user->getModel()) {
				addError(new Error(function_name, "invalid user"));
				return false;
			}
			model->setUserId(user->getModel()->getID());
			model->setTaskType(type);
			model->setRequest(mProtoTransaction.SerializeAsString());
			if (!model->insertIntoDB(true)) {
				
				return false;
			}
			return true;
		}

		bool Transaction::sign(Poco::AutoPtr<controller::User> user)
		{
			static const char function_name[] = "Transaction::addSign";
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
				
			if (user.isNull() || !user->getModel()) 
			{
				addError(new Error(function_name, "error user is invalid"));
				return false;
			}
			std::string bodyBytes;
			try {
				bodyBytes = mTransactionBody->getBodyBytes();
			}
			catch (Poco::Exception& ex) {
				addError(new Error(function_name, "error getting body bytes"));
				return false;
			}
			auto hash = DRMakeStringHash(bodyBytes.data(), bodyBytes.size());

			
			auto sigMap = mProtoTransaction.mutable_sig_map();
			if (sigMap->sigpair_size() > 0 && mBodyBytesHash && mBodyBytesHash != hash) 
			{
				addError(new Error(function_name, "body bytes hash has changed and signature(s) exist already!"));
				return false;
			}
			if (mBodyBytesHash != hash) {
				mProtoTransaction.set_body_bytes(bodyBytes.data(), bodyBytes.size());
			}
			mBodyBytesHash = hash;

			auto pubkeyBin = user->getModel()->getPublicKey();

			// check if pubkey already exist
			for (auto it = sigMap->sigpair().begin(); it != sigMap->sigpair().end(); it++)
			{
				if (it->pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
					addError(new Error(function_name, "error signature pubkey hasn't expected size!"));
					return false;
				}
				if (0 == memcmp(pubkeyBin, it->pubkey().data(), KeyPairEd25519::getPublicKeySize())) {
					addError(new ParamError(function_name, "error, pubkey has signed already from user: ", user->getModel()->getEmail()));
					return false;
				}
			}


			auto mm = MemoryManager::getInstance();
			auto gradido_key_pair = user->getGradidoKeyPair();
			KeyPairEd25519* recovered_gradido_key_pair = nullptr;

			if (!gradido_key_pair || !gradido_key_pair->hasPrivateKey()) 
			{
				if (!user->tryLoadPassphraseUserBackup(&recovered_gradido_key_pair))  
				{
					if (user->setGradidoKeyPair(recovered_gradido_key_pair)) 
					{
						user->getModel()->updatePrivkey();
					}
				} 
				else 
				{
					addError(new Error(function_name, "user cannot decrypt private key"));
					return false;
				}
			}
			

			MemoryBin* sign = nullptr;
			if (gradido_key_pair) 
			{
				sign = gradido_key_pair->sign(bodyBytes);
			}
			else if (recovered_gradido_key_pair) 
			{
				sign = recovered_gradido_key_pair->sign(bodyBytes);
			}
			if (!sign) 
			{
				ErrorManager::getInstance()->sendErrorsAsEmail();
				addError(new Error(function_name, "error by calculate signature"));
				mm->releaseMemory(sign);
				return false;
			}
			auto sigPair = sigMap->add_sigpair();
			auto pubkeyBytes = sigPair->mutable_pubkey();
			*pubkeyBytes = std::string((const char*)pubkeyBin, crypto_sign_PUBLICKEYBYTES);

			auto sigBytes = sigPair->mutable_ed25519();
			*sigBytes = std::string((char*)*sign, sign->size());
			mm->releaseMemory(sign);

			updateRequestInDB();
			// check if enough signatures exist for next step
			if (getSignCount() >= mTransactionBody->getTransactionBase()->getMinSignatureCount())
			{
				UniLib::controller::TaskPtr transaction_send_task(new SendTransactionTask(Poco::AutoPtr<Transaction>(this, true)));
				transaction_send_task->scheduleTask(transaction_send_task);
			}

			//getModel()->updateIntoDB("request", )
			printf("[Transaction::sign] reference-count: %d\n", mReferenceCount);
			return true;
		}

		bool Transaction::updateRequestInDB()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto size = mProtoTransaction.ByteSize();
			std::string transaction_serialized = std::string(size, 0);
			mProtoTransaction.SerializeToString(&transaction_serialized);
			auto model = getModel();
			model->setRequest(transaction_serialized);
			return model->updateRequest();
		}

		TransactionValidation Transaction::validate()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto sig_map = mProtoTransaction.sig_map();

			// check if all signatures belong to current body bytes
			auto body_bytes = mProtoTransaction.body_bytes();
			for (auto it = sig_map.sigpair().begin(); it != sig_map.sigpair().end(); it++) 
			{
				KeyPairEd25519 key_pair((const unsigned char*)it->pubkey().data());
				if (!key_pair.verify(body_bytes, it->ed25519())) {
					return TRANSACTION_VALID_INVALID_SIGN;
				}
			}

			auto transaction_base = mTransactionBody->getTransactionBase();
			auto result = transaction_base->checkRequiredSignatures(&sig_map);

			if (result == TRANSACTION_VALID_OK) {
				return transaction_base->validate();
			}
			return result;

		}
		bool Transaction::hasSigned(Poco::AutoPtr<controller::User> user)
		{
			static const char* function_name = "Transaction::hasSigned";
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto sig_pairs = mProtoTransaction.sig_map().sigpair();
			auto pubkey = user->getModel()->getPublicKey();
			auto pubkey_size = user->getModel()->getPublicKeySize();
			if (KeyPairEd25519::getPublicKeySize() != pubkey_size) {
				addError(new ParamError(function_name, "user public key has invalid size: ", pubkey_size));
				return false;
			}
			for (auto it = sig_pairs.begin(); it != sig_pairs.end(); it++) 
			{
				if (it->pubkey().size() != KeyPairEd25519::getPublicKeySize()) {
					addError(new ParamError(function_name, "signed public key has invalid length: ", it->pubkey().size()));
					return false;
				}
				if (memcmp(pubkey, it->pubkey().data(), pubkey_size) == 0) {
					return true;
				}
			}
			return false;
		}

		//! return true if user must sign it and hasn't yet
		bool Transaction::mustSign(Poco::AutoPtr<controller::User> user)
		{
			if (hasSigned(user)) return false;
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto transaction_base = mTransactionBody->getTransactionBase();
			return transaction_base->isPublicKeyRequired(user->getModel()->getPublicKey());
		}

		//! return true if user can sign transaction and hasn't yet
		bool Transaction::canSign(Poco::AutoPtr<controller::User> user)
		{
			if (hasSigned(user)) return false;
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto transaction_base = mTransactionBody->getTransactionBase();
			return !transaction_base->isPublicKeyForbidden(user->getModel()->getPublicKey());
		}

		bool Transaction::needSomeoneToSign(Poco::AutoPtr<controller::User> user)
		{
			if (!canSign(user)) return false;
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto transaction_base = mTransactionBody->getTransactionBase();
			if (transaction_base->isPublicKeyRequired(user->getModel()->getPublicKey())) {
				return false;
			}
			if (transaction_base->getMinSignatureCount() > getSignCount()) {
				return true;
			}
			return false;

		}

		int Transaction::runSendTransaction()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			static const char* function_name = "Transaction::runSendTransaction";
			auto result = validate();
			if (TRANSACTION_VALID_OK != result) {
				if (   TRANSACTION_VALID_MISSING_SIGN == result || TRANSACTION_VALID_CODE_ERROR == result 
					|| TRANSACTION_VALID_MISSING_PARAM == result || TRANSCATION_VALID_INVALID_PUBKEY == result
					|| TRANSACTION_VALID_INVALID_SIGN == result) {
					addError(new ParamError(function_name, "code error", TransactionValidationToString(result)));
					sendErrorsAsEmail();

				} else if (mTransactionBody->isGroupMemberUpdate()) {
					addError(new ParamError(function_name, "validation return: ", TransactionValidationToString(result)));
					sendErrorsAsEmail();
				}
				else 
				{
					
					std::string error_name;
					std::string error_description;
					auto lm = LanguageManager::getInstance();
					auto user_model = getUser()->getModel();
					auto t = lm->getFreeCatalog(lm->languageFromString(user_model->getLanguageKey()));
					switch (result) {
					case TRANSACTION_VALID_FORBIDDEN_SIGN: 
						error_name = t->gettext_str("Signature Error");
						error_description = t->gettext_str("Invalid signature!");
						break;
					case TRANSACTION_VALID_INVALID_TARGET_DATE: 
						error_name = t->gettext_str("Creation Error");
						error_description = t->gettext_str("Invalid target date! No future and only 3 month in the past.");
						break;
					case TRANSACTION_VALID_CREATION_OUT_OF_BORDER:
						error_name = t->gettext_str("Creation Error");
						error_description = t->gettext_str("Maximal 1000 GDD per month allowed!");
						break;
					case TRANSACTION_VALID_INVALID_AMOUNT:
						error_name = t->gettext_str("Transfer Error");
						error_description = t->gettext_str("Invalid GDD amount! Amount must be greater than 0 and maximal your balance.");
						break;
					case TRANSACTION_VALID_INVALID_GROUP_ALIAS:
						error_name = t->gettext_str("Group Error");
						error_description = t->gettext_str("Invalid Group Alias! I didn't know group, please check alias and try again.");
						break;
					default: 
						error_name = t->gettext_str("Unknown Error");
						error_description = t->gettext_str("Admin gets an E-Mail");
						addError(new ParamError(function_name, "unknown error", TransactionValidationToString(result)));
						sendErrorsAsEmail();
					}

					auto pt = PendingTasksManager::getInstance();
					pt->reportErrorToCommunityServer(Poco::AutoPtr<Transaction>(this, true), error_name, error_description);
				}
				return -1;
			}
			else 
			{
				// send transaction via hedera
				auto network_type = ServerConfig::g_HederaNetworkType;
				// TODO: get correct topic id for user group
				//int user_group_id = 1;
				//auto topic_id = controller::HederaId::find(user_group_id, network_type);
				auto topic_id = controller::HederaId::load(getModel()->getHederaId());
				auto hedera_operator_account = controller::HederaAccount::pick(network_type, false);

				if (!topic_id.isNull() && !hedera_operator_account.isNull()) 
				{
					auto crypto_key = hedera_operator_account->getCryptoKey();
					if (!crypto_key.isNull()) 
					{
						model::hedera::ConsensusSubmitMessage consensus_submit_message(topic_id);
						std::string raw_message = mProtoTransaction.SerializeAsString();

						if (ServerConfig::HEDERA_CONSENSUS_FORMAT_BINARY == ServerConfig::g_ConsensusMessageFormat) {
							consensus_submit_message.setMessage(raw_message);
						}
						else if (ServerConfig::HEDERA_CONSENSUS_FORMAT_BASE64_URLSAVE_NO_PADDING == ServerConfig::g_ConsensusMessageFormat) {
							consensus_submit_message.setMessage(DataTypeConverter::binToBase64((const unsigned char*)raw_message.data(), raw_message.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING));
						}
						else if (ServerConfig::HEDERA_CONSENSUS_FORMAT_JSON == ServerConfig::g_ConsensusMessageFormat) {
							std::string json_message = "";
							std::string json_message_body = "";
							google::protobuf::util::JsonPrintOptions options;
							options.add_whitespace = true;
							options.always_print_primitive_fields = true;

							auto status = google::protobuf::util::MessageToJsonString(mProtoTransaction, &json_message, options);
							if (!status.ok()) {
								addError(new ParamError(function_name, "error by parsing transaction message to json", status.ToString()));
								addError(new ParamError(function_name, "pending task id: ", getModel()->getID()));
								sendErrorsAsEmail();
								return -7;
							}

							status = google::protobuf::util::MessageToJsonString(*mTransactionBody->getBody(), &json_message_body, options);
							if (!status.ok()) {
								addError(new ParamError(function_name, "error by parsing transaction body message to json", status.ToString()));
								addError(new ParamError(function_name, "pending task id: ", getModel()->getID()));
								sendErrorsAsEmail();
								return -8;
							}
							//\"bodyBytes\": \"MigKIC7Sihz14RbYNhVAa8V3FSIhwvd0pWVvZqDnVA91dtcbIgRnZGQx\"
							int startBodyBytes = json_message.find("bodyBytes") + std::string("\"bodyBytes\": \"").size()-2;
							int endCur = json_message.find_first_of('\"', startBodyBytes+2)+1;
							json_message.replace(startBodyBytes, endCur - startBodyBytes, json_message_body);
							//printf("json: %s\n", json_message.data());
							
							consensus_submit_message.setMessage(json_message);
						}
						// if using testnet, transfer message base64 encoded to check messages in hedera block explorer
						//if (network_type == table::HEDERA_TESTNET) {
							//consensus_submit_message.setMessage(DataTypeConverter::binToBase64((const unsigned char*)raw_message.data(), raw_message.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING));
						//}
						//else {
							
						//}
						auto hedera_transaction_body = hedera_operator_account->createTransactionBody();
						hedera_transaction_body->setConsensusSubmitMessage(consensus_submit_message);
						model::hedera::Transaction hedera_transaction;
						hedera_transaction.sign(crypto_key->getKeyPair(), std::move(hedera_transaction_body));

						HederaRequest hedera_request;
						Poco::AutoPtr<HederaTask> hedera_task(new HederaTask(this));
						
						if (HEDERA_REQUEST_RETURN_OK != hedera_request.request(&hedera_transaction, hedera_task)) 
						{
							addError(new Error(function_name, "error send transaction to hedera"));
							getErrors(&hedera_request);
							sendErrorsAsEmail();
							return -2;
						}
						else {
							auto hedera_transaction_response = hedera_task->getTransactionResponse();
							auto hedera_precheck_code_string = hedera_transaction_response->getPrecheckCodeString();
							auto precheck_code = hedera_transaction_response->getPrecheckCode();
							auto cost = hedera_transaction_response->getCost();

							printf("hedera response: %s, cost: %" PRIu64 "\n", hedera_precheck_code_string.data(), cost);
							if (precheck_code == proto::INVALID_TRANSACTION_START) {
								int zahl = 0;
								return -5;
							}
							else if (precheck_code == proto::OK) {
								// simply assume if transaction was sended to hedera without error, it was also accepted from gradido node
								// TODO: later check, but now I haven't any way to communicate with the gradido node
								mTransactionBody->getTransactionBase()->transactionAccepted(getUser());
								// trigger community server update in 5 seconds
								CronManager::getInstance()->scheduleUpdateRun(Poco::Timespan(5000, 0));
								return 1;
							}

						}
						//model::hedera::TransactionBody hedera_transaction_body()
					}
					else 
					{
						addError(new ParamError(function_name, "hedera crypto key not found for paying for consensus submit message! NetworkType: ", network_type));
						sendErrorsAsEmail();
						return -3;
					}
				}
				else 
				{
					addError(new Error(function_name, "hedera topic id or operator account not found!"));
					addError(new ParamError(function_name, "topic id: ", topic_id->getModel()->toString()));
					addError(new ParamError(function_name, "network type: ", network_type));
					sendErrorsAsEmail();
					return -4;
				}
				return 0;
			}

		}
		
	
		/// TASK ////////////////////////
		SendTransactionTask::SendTransactionTask(Poco::AutoPtr<Transaction> transaction)
			: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mTransaction(transaction)
		{

		}

		int SendTransactionTask::run()
		{
			auto result = mTransaction->runSendTransaction();
			printf("[SendTransactionTask::run] result: %d\n", result);
			// delete because of error
			if (-1 == result) {
				mTransaction->deleteFromDB();
			}
			// delete because succeed, maybe change later
			if (1 == result) {
				mTransaction->deleteFromDB();
			}
			return 0;
		}

	}
}