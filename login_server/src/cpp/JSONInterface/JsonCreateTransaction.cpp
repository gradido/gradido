#include "JsonCreateTransaction.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "../model/gradido/Transaction.h"

#include "../SingletonManager/ErrorManager.h"

Poco::JSON::Object* JsonCreateTransaction::handle(Poco::Dynamic::Var params)
{
	auto sm = SessionManager::getInstance();

	int session_id = 0;
	std::string transaction_type;
	std::string blockchain_type;

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("session_id").convert(session_id);
			paramJsonObject->get("transaction_type").convert(transaction_type);
			paramJsonObject->get("blockchain_type").convert(blockchain_type);
			paramJsonObject->get("memo").convert(mMemo);
			auto auto_sign = paramJsonObject->get("auto_sign");
			if (!auto_sign.isEmpty()) {
				auto_sign.convert(mAutoSign);
			}
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}
	mBlockchainType = model::gradido::TransactionBody::blockchainTypeFromString(blockchain_type);
	if (model::gradido::BLOCKCHAIN_UNKNOWN == mBlockchainType) {
		return stateError("unknown blockchain type");
	}
	// allow session_id from community server (allowed caller)
	// else use cookie (if call cames from vue)
	if (!session_id) {
		return stateError("session_id invalid");
	}

	mSession = sm->getSession(session_id);
	if (!mSession) {
		return stateError("session not found");
	}
	auto user = mSession->getNewUser();
	if (user.isNull()) {
		auto em = ErrorManager::getInstance();
		em->addError(new Error("JsonCreateTransaction", "session hasn't a user, check code"));
		em->sendErrorsAsEmail();
		return customStateError("code error", "user is zero");
	}
	
	if (mBlockchainType == model::gradido::BLOCKCHAIN_HEDERA) {
		getTargetGroup(params);
	}
	else {
		if (!getTargetGroup(params)) {
			mTargetGroup = controller::Group::load(user->getModel()->getGroupId());
		}
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

Poco::JSON::Object* JsonCreateTransaction::transfer(Poco::Dynamic::Var params)
{
	static const char* function_name = "JsonCreateTransaction::transfer";
	auto target_pubkey = getTargetPubkey(params);
	if (!target_pubkey) {
		return customStateError("not found", "receiver not found");
	}

	auto sender_user = mSession->getNewUser();
	Poco::UInt32 amount = 0;
	auto mm = MemoryManager::getInstance();
	Poco::JSON::Object* result = nullptr;

	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		try {
			paramJsonObject->get("amount").convert(amount);
		}
		catch (Poco::Exception& ex) {
			result = stateError("json exception", ex.displayText());
		}
	}
	else {
		result = stateError("parameter format unknown");
	}
	if (mMemo.size() < 5 || mMemo.size() > 150) {
		result = stateError("memo is not set or not in expected range [5;150]");
	}
	if (result) {
		mm->releaseMemory(target_pubkey);
		return result;
	}
	
	if (!mReceiverUser.isNull() && mReceiverUser->getModel()) {
		auto receiver_user_model = mReceiverUser->getModel();
		if (receiver_user_model->isDisabled()) {
			result = customStateError("disabled", "receiver is disabled");
		}
		if (!mTargetGroup.isNull() && receiver_user_model->getGroupId() != mTargetGroup->getModel()->getID()) {
			result = stateError("user not in group", "receiver user isn't in target group");
		}
	}
	
	auto gradido_key_pair = sender_user->getGradidoKeyPair();
	if (gradido_key_pair) {
		if (gradido_key_pair->isTheSame(*target_pubkey)) {
			result = stateError("sender and receiver are the same");
		}
	}
	else {
		printf("user hasn't valid key pair set\n");
	}
	if (!result) {
		try {
			auto transaction = model::gradido::Transaction::createTransfer(sender_user, target_pubkey, mTargetGroup, amount, mMemo, mBlockchainType);

			if (mAutoSign) {
				Poco::JSON::Array errors;
				transaction->sign(sender_user);
				if (transaction->errorCount() > 0) {
					errors.add(transaction->getErrorsArray());
				}

				if (errors.size() > 0) {
					return stateError("error by signing transaction", errors);
				}
			}
		}
		catch (Poco::Exception& ex) {
			NotificationList errors;
			errors.addError(new ParamError(function_name, "poco exception: ", ex.displayText()));
			errors.sendErrorsAsEmail();
			return stateError("exception");
		} 
		catch (std::exception& ex) {
			NotificationList errors;
			errors.addError(new ParamError(function_name, "std::exception: ", ex.what()));
			errors.sendErrorsAsEmail();
			return stateError("exception");
		}
		result = stateSuccess();
	}
	mm->releaseMemory(target_pubkey);
	return result;
}
Poco::JSON::Object* JsonCreateTransaction::creation(Poco::Dynamic::Var params)
{
	static const char* function_name = "JsonCreateTransaction::creation";
	auto target_pubkey = getTargetPubkey(params);
	if (!target_pubkey) {
		return customStateError("not found", "receiver not found");
	} 

	Poco::UInt32 amount = 0;
	Poco::DateTime target_date;
	auto mm = MemoryManager::getInstance();
	Poco::JSON::Object* result = nullptr;

	if (params.type() == typeid(Poco::JSON::Object::Ptr)) 
	{
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		try {
			paramJsonObject->get("amount").convert(amount);
			paramJsonObject->get("target_date").convert(target_date);
		}
		catch (Poco::Exception& ex) {
			result = stateError("json exception", ex.displayText());
		}
	}
	else 
	{
		result = stateError("parameter format unknown");
	}
	
	if (amount <= 0 || amount > 10000000) {
		result = customStateError("invalid parameter", "invalid amount", "GDD amount in GDD cent ]0,10000000]");
	}

	if (mReceiverUser.isNull()) {
		mReceiverUser = controller::User::create();
		if (1 != mReceiverUser->load(target_pubkey->data())) {
			mReceiverUser.assign(nullptr);
			result = customStateError("not found", "receiver not found");
		}
	}

	if (result) {
		mm->releaseMemory(target_pubkey);
		return result;
	}
	
	if (!mReceiverUser.isNull() && mReceiverUser->getModel()) {
		auto receiver_user_model = mReceiverUser->getModel();
		
		if (receiver_user_model->isDisabled()) {
			result = customStateError("disabled", "receiver is disabled");
		}
		if (!receiver_user_model->getGroupId()) {
			result = stateError("receiver user hasn't group");
		}
		if (receiver_user_model->getGroupId() != mSession->getNewUser()->getModel()->getGroupId()) {
			result = stateError("user not in group", "target user is in another group");
		}
	}
	
	if(!result) {
		try {
			auto transaction = model::gradido::Transaction::createCreation(mReceiverUser, amount, target_date, mMemo, mBlockchainType);
			if (mAutoSign) {
				if (!transaction->sign(mSession->getNewUser())) {
					return stateError("error by signing transaction", transaction);
				}
			}
		} 
		catch (Poco::Exception& ex) {
			NotificationList errors;
			errors.addError(new ParamError(function_name, "poco exception: ", ex.displayText()));
			errors.sendErrorsAsEmail();
			return stateError("exception");
		} 
		catch (std::exception& ex) {
			NotificationList errors;
			errors.addError(new ParamError(function_name, "std::exception: ", ex.what()));
			errors.sendErrorsAsEmail();
			return stateError("exception");
		}
		
		result = stateSuccess();
	}
	mm->releaseMemory(target_pubkey);
	
	return result;

}
Poco::JSON::Object* JsonCreateTransaction::groupMemberUpdate(Poco::Dynamic::Var params)
{
	if (mBlockchainType == model::gradido::BLOCKCHAIN_MYSQL) {
		return stateError("groupMemberUpdate not allowed with mysql blockchain");
	}
	if (mTargetGroup.isNull()) {
		return stateError("group not found");
	}
	auto transaction = model::gradido::Transaction::createGroupMemberUpdate(mSession->getNewUser(), mTargetGroup);
	if (mAutoSign) {
		if (!transaction->sign(mSession->getNewUser())) {
			return stateError("error by signing transaction", transaction);
		}
	}
	return stateSuccess();

}
MemoryBin* JsonCreateTransaction::getTargetPubkey(Poco::Dynamic::Var params)
{
	std::string email;
	std::string target_username;
	std::string target_pubkey_hex;
	
	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	auto fields = paramJsonObject->getNames();
	try {
		for (auto it = fields.begin(); it != fields.end(); it++) {
			if (*it == "target_email") {
				paramJsonObject->get("target_email").convert(email);
				break;
			}
			if (*it == "target_username") {
				paramJsonObject->get("target_username").convert(target_username);
				break;
			}
			if (*it == "target_pubkey") {
				paramJsonObject->get("target_pubkey").convert(target_pubkey_hex);
				break;
			}
		}
	}
	catch (Poco::Exception& ex) {
		return nullptr;
	}
	mReceiverUser = controller::User::create();
	int result_count = 0;
	
	MemoryBin* result = nullptr;
	if (email != "") {
		result_count = mReceiverUser->load(email);
	}
	else if (target_username != "") {
		int group_id = 0;
		if (!mTargetGroup.isNull()) {
			group_id = mTargetGroup->getModel()->getID();
		} else {
			mSession->getNewUser()->getModel()->getGroupId();
		}
		result_count = mReceiverUser->getModel()->loadFromDB({ "username", "group_id" }, target_username, group_id, model::table::MYSQL_CONDITION_AND);
	}
	else if (target_pubkey_hex != "") {
		result = DataTypeConverter::hexToBin(target_pubkey_hex);
	}
	if (1 == result_count) {
		result = mReceiverUser->getModel()->getPublicKeyCopy();
	}
	else {
		mReceiverUser.assign(nullptr);
	}
	return result;
}

bool JsonCreateTransaction::getTargetGroup(Poco::Dynamic::Var params)
{
	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	try 
	{
		auto group_id_obj = paramJsonObject->get("group_id");
		
		if (!group_id_obj.isEmpty()) {
			int group_id = 0;
			group_id_obj.convert(group_id);
			if (!group_id) {
				mTargetGroup = controller::Group::load(group_id);
				if (!mTargetGroup.isNull()) {
					return true;
				}
			}
		}

		auto group_alias_obj = paramJsonObject->get("group_alias");

		if (!group_alias_obj.isEmpty()) {

			std::string group_alias;
			group_alias_obj.convert(group_alias);
			auto groups = controller::Group::load(group_alias);
			if (groups.size() == 1) {
				mTargetGroup = groups[0];
				return true;
			}
		}
	
	}
	catch (Poco::Exception& ex) {
		return false;
	}
	return false;
}
