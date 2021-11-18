#include "JsonCreateTransaction.h"

#include "controller/User.h"

#include "lib/DataTypeConverter.h"

#include "model/gradido/Transaction.h"

#include "SingletonManager/ErrorManager.h"

#include "Poco/DateTimeParser.h"

#include "rapidjson/document.h"
#include "rapidjson/pointer.h"

using namespace rapidjson;

Document JsonCreateTransaction::handle(const Document& params)
{
	auto paramError = checkAndLoadSession(params);
	if (paramError.IsObject()) { return paramError; }

	std::string transaction_type;
	paramError = getStringParameter(params, "transaction_type", transaction_type);
	if (paramError.IsObject()) { return paramError; }

	std::string blockchain_type;
	paramError = getStringParameter(params, "blockchain_type", blockchain_type);
	if (paramError.IsObject()) { return paramError; }

	paramError = getStringParameter(params, "memo", mMemo);
	if (paramError.IsObject()) { return paramError; }

	getBoolParameter(params, "auto_sign", mAutoSign);

	mBlockchainType = model::gradido::TransactionBody::blockchainTypeFromString(blockchain_type);
	if (model::gradido::BLOCKCHAIN_UNKNOWN == mBlockchainType) {
		return stateError("unknown blockchain type");
	}
	// allow session_id from community server (allowed caller)
	// else use cookie (if call cames from vue)
	if (!mSession) {
		return stateError("session not found");
	}

	auto user = mSession->getNewUser();

	if (mBlockchainType != model::gradido::BLOCKCHAIN_MYSQL) {
		getTargetGroup(params);
	}
	else {
		mTargetGroup = controller::Group::load(user->getModel()->getGroupId());
	}
	if (transaction_type == "transfer") {
		return transfer(params);
	}
	else if (transaction_type == "creation") {
		return creation(params);
	}
	else if (transaction_type == "groupMemberUpdate") {
		return groupMemberUpdate(params);
	}

	return stateError("transaction_type unknown");

}

Document JsonCreateTransaction::transfer(const Document& params)
{
	static const char* function_name = "JsonCreateTransaction::transfer";
	auto mm = MemoryManager::getInstance();
	auto target_pubkey = getTargetPubkey(params);
	if (!target_pubkey) {
		return customStateError("not found", "receiver not found");
	}

	Poco::UInt32 amount = 0;
	auto param_error = getUIntParameter(params, "amount", amount);
	if (param_error.IsObject()) { return param_error; }

	auto sender_user = mSession->getNewUser();
	Document result(kObjectType);
	auto alloc = result.GetAllocator();

	Value warnings(kArrayType);

	try {
		Poco::AutoPtr<model::gradido::Transaction> transaction;
		if (!mTargetGroup.isNull() && sender_user->getModel()->getGroupId() != mTargetGroup->getModel()->getID()) {
			// cross group transfer transaction
			transaction = model::gradido::Transaction::createTransferCrossGroup(sender_user, target_pubkey, mTargetGroup, amount, mMemo, mBlockchainType);
		}
		else {
			// local transfer transaction
			transaction = model::gradido::Transaction::createTransferLocal(sender_user, target_pubkey, amount, mMemo, mBlockchainType);
		}

		mm->releaseMemory(target_pubkey);
		target_pubkey = nullptr;

		auto transfer_transaction = transaction->getTransactionBody()->getTransferTransaction();
		if (transfer_transaction->prepare()) {
			return stateError("error in transaction details", transfer_transaction);
		}
		if (transfer_transaction->validate()) {
			return stateError("error in validate transaction", transfer_transaction);
		}

		if (mSession->lastTransactionTheSame(transaction)) {
			return stateError("transaction are the same as the last (within 100 seconds)");
		}
		else {
			mSession->setLastTransaction(transaction);
		}

		if (mAutoSign) {
			Value errors(kArrayType);

			transaction->sign(sender_user);
			if (transaction->errorCount() > 0) {
				errors = transaction->getErrorsArray(alloc);
			}
			if (transaction->warningCount() > 0) {
				warnings = transaction->getWarningsArray(alloc);
				result.AddMember("warnings", warnings, alloc);
			}

			if (errors.Size() > 0) {
				result.AddMember("state", "error", alloc);
				result.AddMember("msg", "error by signing transaction", alloc);
				result.AddMember("details", errors, alloc);
				return result;
			}

		}
	}
	catch (Poco::Exception& ex) {
		mm->releaseMemory(target_pubkey);
		NotificationList errors;
		errors.addError(new ParamError(function_name, "poco exception: ", ex.displayText()));
		errors.sendErrorsAsEmail();
		return stateError("exception");
	}
	catch (std::exception& ex) {
		mm->releaseMemory(target_pubkey);
		NotificationList errors;
		errors.addError(new ParamError(function_name, "std::exception: ", ex.what()));
		errors.sendErrorsAsEmail();
		return stateError("exception");
	}
	result.AddMember("state", "success", alloc);
	return result;
}


Document JsonCreateTransaction::creation(const Document& params)
{
	Poco::UInt32 amount = 0;
	Poco::DateTime target_date;
	auto param_error = getUIntParameter(params, "amount", amount);
	if (param_error.IsObject()) { return param_error; }

	std::string date_string;
	param_error = getStringParameter(params, "target_date", date_string);
	if (param_error.IsObject()) { return param_error; }
	int timezoneDifferential = 0;
	try {
		target_date = Poco::DateTimeParser::parse(date_string, timezoneDifferential);
	}
	catch (Poco::Exception& ex) {
		return stateError("cannot parse target_date", ex.what());
	}

	auto mm = MemoryManager::getInstance();

	auto target_pubkey = getTargetPubkey(params);
	if (!target_pubkey) {
		return customStateError("not found", "recipient not found");
	}

	if (mReceiverUser.isNull()) {
		mReceiverUser = controller::User::create();
		if (1 != mReceiverUser->load(target_pubkey->data())) {
			mReceiverUser.assign(nullptr);
			mm->releaseMemory(target_pubkey);
			return customStateError("not found", "recipient not found");
		}
	}
	mm->releaseMemory(target_pubkey);

	if (!mReceiverUser.isNull() && mReceiverUser->getModel()) {
		if (mReceiverUser->getModel()->getGroupId() != mSession->getNewUser()->getModel()->getGroupId()) {
			return stateError("user not in group", "target user is in another group");
		}
	}

	auto transaction = model::gradido::Transaction::createCreation(mReceiverUser, amount, target_date, mMemo, mBlockchainType, true);
	auto creation_transaction = transaction->getTransactionBody()->getCreationTransaction();
	if (creation_transaction->prepare()) {
		return stateError("error in transaction details", creation_transaction);
	}
	if (creation_transaction->validate()) {
		return stateError("error in validate transaction", creation_transaction);
	}
	if (mSession->lastTransactionTheSame(transaction)) {
		return stateError("transaction are the same as the last (within 100 seconds)");
	}
	else {
		mSession->setLastTransaction(transaction);
	}
	if (mAutoSign) {
		if (!transaction->sign(mSession->getNewUser())) {
			return stateError("error by signing transaction", transaction);
		}
	}
	return stateSuccess();
}

Document JsonCreateTransaction::groupMemberUpdate(const Document& params)
{
	if (mBlockchainType == model::gradido::BLOCKCHAIN_MYSQL) {
		return stateError("groupMemberUpdate not allowed with mysql blockchain");
	}
	if (mTargetGroup.isNull()) {
		return stateError("group not found");
	}
	auto transaction = model::gradido::Transaction::createGroupMemberUpdate(mSession->getNewUser(), mTargetGroup, mBlockchainType);
	auto group_member_update_transaction = transaction->getTransactionBody()->getGroupMemberUpdate();
	if (group_member_update_transaction->prepare()) {
		return stateError("error in transaction details", group_member_update_transaction);
	}
	if (group_member_update_transaction->validate()) {
		return stateError("error in validate transaction", group_member_update_transaction);
	}
	if (mSession->lastTransactionTheSame(transaction)) {
		return stateError("transaction are the same as the last (within 100 seconds)");
	}
	else {
		mSession->setLastTransaction(transaction);
	}
	if (mAutoSign) {
		if (!transaction->sign(mSession->getNewUser())) {
			return stateError("error by signing transaction", transaction);
		}
	}
	return stateSuccess();
}

MemoryBin* JsonCreateTransaction::getTargetPubkey(const Document& params)
{
	std::string email, username, pubkeyHex;
	getStringParameter(params, "target_email", email);
	getStringParameter(params, "target_username", username);
	getStringParameter(params, "target_pubkey", pubkeyHex);

	mReceiverUser = controller::User::create();
	int result_count = 0;

	int group_id = 0;
	if (!mTargetGroup.isNull()) {
		group_id = mTargetGroup->getModel()->getID();
	}
	else {
		mSession->getNewUser()->getModel()->getGroupId();
	}

	MemoryBin* result = nullptr;
	if (email.size()) {
		result_count = mReceiverUser->getModel()->loadFromDB({ "email", "group_id" }, email, group_id, model::table::MYSQL_CONDITION_AND);
	}
	else if (username.size()) {
		result_count = mReceiverUser->getModel()->loadFromDB({ "username", "group_id" }, username, group_id, model::table::MYSQL_CONDITION_AND);
	}
	else if (pubkeyHex != "") {
		result = DataTypeConverter::hexToBin(pubkeyHex);
	}
	if (1 == result_count) {
		result = mReceiverUser->getModel()->getPublicKeyCopy();
	}
	else {
		mReceiverUser.assign(nullptr);
	}
	if (!result && !mTargetGroup.isNull())
	{
		// assume that login-server is running on same url as community server under login_api
		auto request = mTargetGroup->createJsonRequest();
		auto alloc = request.getJsonAllocator();

		Value params(kObjectType);
		Value ask(kObjectType);

		if (email.size()) {
			auto emailHash = model::table::User::createEmailHash(email);
			auto emailHashBase64 = DataTypeConverter::binToBase64(emailHash);
			MemoryManager::getInstance()->releaseMemory(emailHash);
			ask.AddMember("account_publickey", Value(emailHashBase64.data(), alloc), alloc);
		}
		else if (username.size()) {
			ask.AddMember("account_publickey", Value(username.data(), alloc), alloc);
		}
		params.AddMember("ask", ask, alloc);
		auto response = request.requestLogin("/login_api/search", params);

		Value* pubkeyJson = Pointer("/results/account_publickey").Get(response);
		if (pubkeyJson && pubkeyJson->IsString()) {
			result = DataTypeConverter::base64ToBin(pubkeyJson->GetString(), pubkeyJson->GetStringLength());
		}
	}

	return result;
}


