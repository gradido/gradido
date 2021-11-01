#include "Transaction.h"
#include "../../SingletonManager/ErrorManager.h"
#include "../../SingletonManager/PendingTasksManager.h"
#include "../../SingletonManager/LanguageManager.h"
#include "../../ServerConfig.h"


#include "../../lib/DataTypeConverter.h"
#include "../../lib/Profiler.h"
#include "../../lib/JsonRequest.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

#include <google/protobuf/util/json_util.h>

#include <inttypes.h>

using namespace rapidjson;

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
			auto blockchain_type = getIntParam("blockchain_type");
			if (blockchain_type > 0) {
				mTransactionBody->setBlockchainType((BlockchainType)blockchain_type);
			}
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

			auto body = TransactionBody::create("", user, proto::gradido::GroupMemberUpdate_MemberUpdateType_ADD_USER, group_model->getAlias());

			Poco::AutoPtr<Transaction> result = new Transaction(body);
			auto model = result->getModel();
			result->insertPendingTaskIntoDB(user, model::table::TASK_TYPE_GROUP_ADD_MEMBER);
			PendingTasksManager::getInstance()->addTask(result);
			return result;
		}

		Poco::AutoPtr<Transaction> Transaction::createCreation(
			Poco::AutoPtr<controller::User> receiver,
			Poco::UInt32 amount,
			Poco::DateTime targetDate,
			const std::string& memo,
			BlockchainType blockchainType,
			bool addToPendingTaskManager/* = true*/
			)
		{
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create creation";

			if (receiver.isNull() || !receiver->getModel()) {
				return nullptr;
			}
			auto receiver_model = receiver->getModel();

			auto body = TransactionBody::create(memo, receiver, amount, targetDate, blockchainType);
			Poco::AutoPtr<Transaction> result = new Transaction(body);

			result->setParam("blockchain_type", (int)blockchainType);
			auto model = result->getModel();

			if (addToPendingTaskManager) {
				result->insertPendingTaskIntoDB(receiver, model::table::TASK_TYPE_CREATION);
				PendingTasksManager::getInstance()->addTask(result);
			}
			return result;
		}

		Poco::AutoPtr<Transaction> Transaction::createTransfer(
			Poco::AutoPtr<controller::User> sender,
			const MemoryBin* receiverPubkey,
			Poco::AutoPtr<controller::Group> receiverGroup,
			Poco::UInt32 amount,
			const std::string& memo,
			BlockchainType blockchainType,
			bool inbound/* = true*/
		)
		{
			Poco::AutoPtr<Transaction> transaction;
			Poco::AutoPtr<TransactionBody> transaction_body;
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create transfer";

			if (sender.isNull() || !sender->getModel() || !receiverPubkey || !amount) {
				return transaction;
			}

			auto sender_model = sender->getModel();


			if (blockchainType == BLOCKCHAIN_MYSQL) {
				transaction_body = TransactionBody::create(memo, sender, receiverPubkey, amount, blockchainType);
				transaction = new Transaction(transaction_body);
			}

			transaction->setParam("blockchain_type", (int)blockchainType);
			transaction->insertPendingTaskIntoDB(sender, model::table::TASK_TYPE_TRANSFER);
			PendingTasksManager::getInstance()->addTask(transaction);

			return transaction;
		}


		Poco::AutoPtr<Transaction> Transaction::createTransfer(
			const MemoryBin* senderPubkey,
			Poco::AutoPtr<controller::User> receiver,
			std::string senderGroupAlias,
			Poco::UInt32 amount,
			const std::string& memo,
			BlockchainType blockchainType
			)
		{
			Poco::AutoPtr<Transaction> result;
			auto em = ErrorManager::getInstance();
			static const char* function_name = "Transaction::create transfer 2";

			if (receiver.isNull() || !receiver->getModel() || !senderPubkey || !amount) {
				return result;
			}

			auto sender_model = sender->getModel();
			auto senderPublicKey = sender_model->getPublicKeyCopy();
			auto recipiantGroupAlias = recipiantGroup->getModel()->getAlias();
			auto senderGroupAlias = sender->getGroup()->getModel()->getAlias();
			Poco::Timestamp now;

			for (int i = 0; i < 2; i++) {
				TransactionTransferType type = TRANSFER_CROSS_GROUP_INBOUND;
				std::string groupAlias = senderGroupAlias;
				if (1 == i) {
					type = TRANSFER_CROSS_GROUP_OUTBOUND;
					groupAlias = recipiantGroupAlias;
				}
				Poco::AutoPtr<TransactionBody> body = TransactionBody::create(memo, senderPublicKey, recipiantPubkey, amount, type, groupAlias, now);
				body->setBlockchainType(blockchainType);
				Poco::AutoPtr<Transaction> transaction(new Transaction(body));
				transaction->setParam("blockchain_type", (int)blockchainType);
				transaction->insertPendingTaskIntoDB(sender, model::table::TASK_TYPE_TRANSFER);
				if (0 == i) {
					inboundTransaction = transaction;
					inboundTransaction->getTransactionBody()->getTransferTransaction()->setOwnGroupAlias(recipiantGroupAlias);
				}
				else if (1 == i) {
					outboundTransaction = transaction;
					outboundTransaction->getTransactionBody()->getTransferTransaction()->setOwnGroupAlias(senderGroupAlias);
				} 
				PendingTasksManager::getInstance()->addTask(transaction);
			}
			Poco::AutoPtr<controller::Group> transaction_group;
			Poco::AutoPtr<controller::Group> topic_group = controller::Group::load(receiver_model->getGroupId());
			if (topic_group.isNull()) {
				em->addError(new ParamError(function_name, "topic group not found", receiver_model->getGroupId()));
				em->sendErrorsAsEmail();
				return result;
			}
			// default constructor set it to now
			Poco::Timestamp pairedTransactionId;
			// create only inbound transaction, and outbound before sending to hedera
			//for (int i = 0; i < 1; i++) {

			//transaction_group = receiverGroup;
			//topic_group = sender_group;

			if (transaction_group.isNull()) {
				em->addError(new Error(function_name, "transaction group is zero, inbound"));
				em->sendErrorsAsEmail();
				return result;
			}

			auto body = TransactionBody::create(memo, senderPubkey, receiver, amount, pairedTransactionId, transaction_group);
			result = new Transaction(body);

			result->setParam("blockchain_type", (int)blockchainType);
			result->insertPendingTaskIntoDB(receiver, model::table::TASK_TYPE_TRANSFER);
			PendingTasksManager::getInstance()->addTask(result);

			return result;
		}


		Poco::AutoPtr<Transaction> Transaction::load(model::table::PendingTask* dbModel)
		{
			proto::gradido::GradidoTransaction transaction_temp;

			Poco::AutoPtr<Transaction> transaction = new Transaction(dbModel->getRequestCopy(), dbModel);
			PendingTasksManager::getInstance()->addTask(transaction);

			// check if transaction was already finished
			auto json = transaction->getModel()->getResultJson();
			bool finished = false;
			if (json.IsObject() && json.HasMember("state")) {
				finished = true;
			}
			// try not finished but signed transactions again
			if (!finished && ServerConfig::g_resendUnfinishedTransactionOnStart) {
				transaction->ifEnoughSignsProceed(nullptr);
			}

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
			*sigBytes = std::string((char*)*sign, crypto_sign_BYTES);
			auto sign_hex_string = DataTypeConverter::binToHex(sign);
			//printf("sign hex: %s\n", sign_hex_string.data());
			mm->releaseMemory(sign);

			updateRequestInDB();

			return ifEnoughSignsProceed(user);
		}

		bool Transaction::ifEnoughSignsProceed(Poco::AutoPtr<controller::User> user)
		{
			// check if enough signatures exist for next step
			if (getSignCount() >= mTransactionBody->getTransactionBase()->getMinSignatureCount())
			{
				if (getTransactionBody()->isTransfer() && !user.isNull()) {
					auto transfer = getTransactionBody()->getTransferTransaction();
					if (transfer->isOutbound()) {
						auto transaction = transfer->createInbound(getTransactionBody()->getMemo());
						if (!transaction.isNull()) {
							transaction->sign(user);
							// dirty hack because gn crashes if its get transactions out of order
							mPairedTransaction = transaction;
							// removed because now using only one hedera node
							//Poco::Thread::sleep(1000);
						}
						else {
							addError(new Error("Transaction::ifEnoughSignsProceed", "Error creating outbound transaction"));
							return false;
						}

					}
				}
				//UniLib::controller::TaskPtr transaction_send_task(new SendTransactionTask(Poco::AutoPtr<Transaction>(this, true)));
				//transaction_send_task->scheduleTask(transaction_send_task);
				auto pt = PendingTasksManager::getInstance();

				// pt->removeTask(Poco::AutoPtr<Transaction>(this, true));
				// deleteFromDB();
				return 1 == runSendTransaction();
				//return true;
			}
			return false;
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
					|| TRANSACTION_VALID_MISSING_PARAM == result || TRANSACTION_VALID_INVALID_PUBKEY == result
					|| TRANSACTION_VALID_INVALID_SIGN == result) {
					addError(new ParamError(function_name, "code error", TransactionValidationToString(result)));
					//sendErrorsAsEmail();

				} else if (mTransactionBody->isGroupMemberUpdate()) {
					addError(new ParamError(function_name, "validation return: ", TransactionValidationToString(result)));
					//sendErrorsAsEmail();
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
						//sendErrorsAsEmail();
					}
					addError(new ParamError(function_name, error_name, error_description));
				}
				return -1;
			}
			else
			{

				if (mTransactionBody->isMysqlBlockchain()) {
					// finale to base64
					auto base_64_message = DataTypeConverter::binToBase64(raw_message, sodium_base64_VARIANT_URLSAFE_NO_PADDING);

					if (base_64_message == "") {
						addError(new Error(function_name, "error convert final transaction to base64"));
						return -7;
					}

					return runSendTransactionMysql(base_64_message, group);
				} else if(mTransactionBody->isIotaBlockchain()) {

					// finale to hex for iota
					auto hex_message = DataTypeConverter::binToHex(raw_message);
					if (hex_message == "") {
						addError(new Error(function_name, "error convert final transaction to hex"));
						return -7;
					}
					if (mTransactionBody->isTransfer() && mTransactionBody->getTransferTransaction()->isCrossGroup()) {
						auto groups = controller::Group::load(mTransactionBody->getTransferTransaction()->getOwnGroupAlias());
						if (groups.size() == 1) {
							group = groups[0];
						}
					}

                    return runSendTransactionIota(hex_message, group);
				}
				addError(new ParamError(function_name, "not implemented blockchain type", mTransactionBody->getBlockchainTypeString()));
				return -10;
			}

		}

		int Transaction::runSendTransactionMysql()
		{
			static const char* function_name = "Transaction::runSendTransactionMysql";
			auto mm = MemoryManager::getInstance();
			
			
			std::string raw_message = mProtoTransaction.SerializeAsString();
			if (raw_message == "") {
				addError(new Error("SigningTransaction", "error serializing final transaction"));
				return -6;
			}

			// finale to base64
			auto base_64_message = DataTypeConverter::binToBase64(raw_message, sodium_base64_VARIANT_URLSAFE_NO_PADDING);

			if (base_64_message == "") {
				addError(new Error(function_name, "error convert final transaction to base64"));
				return -7;
			}

			static Poco::FastMutex log_file_mutex;
			{
				std::string json_transaction = getTransactionAsJson(true);
				std::string date_time_string = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d%m%yT%H%M%S") + "\n";

				Poco::ScopedLock<Poco::FastMutex> _lock(log_file_mutex);

				FILE* f = fopen("transactions.log", "a");
				fwrite(date_time_string.data(), 1, date_time_string.size(), f);
				fwrite(json_transaction.data(), 1, json_transaction.size(), f);
				fwrite(base_64_message.data(), 1, base_64_message.size(), f);
				fwrite("\n", sizeof("\n"), 1, f);
				fclose(f);
			}

			// create json request
			auto user = getUser();
			if (user.isNull()) {
				addError(new Error(function_name, "user is zero"));
				return -8;
			}
			auto group = user->getGroup();
			if (group.isNull()) {
				addError(new Error(function_name, "group is zero"));
				return -9;
			}
			auto json_request = group->createJsonRequest();
			auto alloc = json_request.getJsonAllocator();
			Value param(kObjectType);
			param.AddMember("transaction", Value(base_64_message.data(), base_64_message.size(), alloc), alloc);
			auto result = json_request.request("putTransaction", param.Move());
			json_request.getWarnings(&json_request);

			if (JSON_REQUEST_RETURN_OK == result)
			{
				if (!json_request.errorCount()) {
					finishSuccess();
				}
				else {
					getErrors(&json_request);
					return -1;
				}
				return 1;
			}

			json_request.getWarnings(&json_request);
			getErrors(&json_request);

			return -1;
		}

		std::string Transaction::getTransactionAsJson(bool replaceBase64WithHex/* = false*/)
		{
			static const char* function_name = "Transaction::getTransactionAsJson";
			std::string json_message = "";
			std::string json_message_body = "";
			google::protobuf::util::JsonPrintOptions options;
			options.add_whitespace = true;
			options.always_print_primitive_fields = true;

			auto status = google::protobuf::util::MessageToJsonString(mProtoTransaction, &json_message, options);
			if (!status.ok()) {
				addError(new ParamError(function_name, "error by parsing transaction message to json", status.ToString()));
				addError(new ParamError(function_name, "pending task id: ", getModel()->getID()));
				return "";
			}

			status = google::protobuf::util::MessageToJsonString(*mTransactionBody->getBody(), &json_message_body, options);
			if (!status.ok()) {
				addError(new ParamError(function_name, "error by parsing transaction body message to json", status.ToString()));
				addError(new ParamError(function_name, "pending task id: ", getModel()->getID()));
				return "";
			}
			//\"bodyBytes\": \"MigKIC7Sihz14RbYNhVAa8V3FSIhwvd0pWVvZqDnVA91dtcbIgRnZGQx\"
			int startBodyBytes = json_message.find("bodyBytes") + std::string("\"bodyBytes\": \"").size() - 2;
			int endCur = json_message.find_first_of('\"', startBodyBytes + 2) + 1;
			json_message.replace(startBodyBytes, endCur - startBodyBytes, json_message_body);
			//printf("json: %s\n", json_message.data());

			if (replaceBase64WithHex) {
				Document parsed_json;
				parsed_json.Parse(json_message.data(), json_message.size());
				if (parsed_json.HasParseError()) {
					addError(new ParamError(function_name, "error by parsing or printing json", parsed_json.GetParseError()));
					addError(new ParamError(function_name, "parsing error offset ", parsed_json.GetErrorOffset()));
				}
				else {
					if (DataTypeConverter::replaceBase64WithHex(parsed_json, parsed_json.GetAllocator())) {
						StringBuffer buffer;
						Writer<StringBuffer> writer(buffer);
						parsed_json.Accept(writer);

						json_message = std::string(parsed_json.GetString(), parsed_json.GetStringLength());
					}
				}
			}

			return json_message;

		}

		bool Transaction::isTheSameTransaction(Poco::AutoPtr<Transaction> other)
		{
			bool result = false;

			auto other_proto = other->getTransactionBody()->getBody();
			auto other_created = other_proto->created();
			auto own_body_bytes = getTransactionBody()->getBodyBytes();
			auto own_body_updated = new proto::gradido::TransactionBody;
			own_body_updated->ParseFromString(own_body_bytes);
			auto own_created = own_body_updated->mutable_created();
			Poco::Int64 timeDiff = other_created.seconds() - own_created->seconds();
			*own_created = other_created;

			result = own_body_updated->SerializeAsString() == other_proto->SerializeAsString();

			delete own_body_updated;

			// if they are more than 10 seconds between transaction they consider as not the same
			if (abs(timeDiff) > 10) {
				return false;
			}

			return result;
		}


		/// TASK ////////////////////////
		SendTransactionTask::SendTransactionTask(Poco::AutoPtr<Transaction> transaction)
			: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mTransaction(transaction)
		{

		}

		int SendTransactionTask::run()
		{
			int result = 1;
			// if transfer inbound, create also transfer outbound
			/*if (mTransaction->getTransactionBody()->isTransfer()) {
				auto transfer = mTransaction->getTransactionBody()->getTransferTransaction();
				if (transfer->isInbound()) {
					auto outbound = transfer->createOutbound(mTransaction->getTransactionBody()->getMemo());
					if (outbound.isNull()) { result = -1;}

					result = outbound->runSendTransaction();
				}
			}
			if (result != 1) {
				mTransaction->deleteFromDB();
				return 0;
			}*/
			result = mTransaction->runSendTransaction();
			//printf("[SendTransactionTask::run] result: %d\n", result);
			// delete because of error
			if (-1 == result) {
				//mTransaction->deleteFromDB();
				Document errors(kObjectType);
				auto alloc = errors.GetAllocator();
				errors.AddMember("errors", mTransaction->getErrorsArray(alloc), alloc);
				errors.AddMember("state", "error", alloc);
				auto model = mTransaction->getModel();
				model->setResultJson(errors);
				model->updateFinishedAndResult();
			}
			if (result < -1) {
				mTransaction->sendErrorsAsEmail();
			}
			// delete because succeed, maybe change later
			if (1 == result) {
				//mTransaction->deleteFromDB();
			}

			return 0;
		}

	}
}
