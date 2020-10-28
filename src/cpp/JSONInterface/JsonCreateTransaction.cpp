#include "JsonCreateTransaction.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "../model/gradido/Transaction.h"

Poco::JSON::Object* JsonCreateTransaction::handle(Poco::Dynamic::Var params)
{
	auto sm = SessionManager::getInstance();

	int session_id = 0;
	std::string transaction_type;

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
			paramJsonObject->get("memo").convert(mMemo);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	if (!session_id) {
		return stateError("session_id invalid");
	}

	mSession = sm->getSession(session_id);
	if (!mSession) {
		return customStateError("not found", "session not found");
	}
	auto user = mSession->getNewUser();
	if (user.isNull()) {
		return customStateError("code error", "user is zero");
	}
	getTargetGroup(params);
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
	auto target_pubkey = getTargetPubkey(params);
	Poco::UInt32 amount = 0;
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		try {
			paramJsonObject->get("amount").convert(amount);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	model::gradido::Transaction::createTransfer(mSession->getNewUser(), target_pubkey, mTargetGroup, amount, mMemo);
	return stateSuccess();
}
Poco::JSON::Object* JsonCreateTransaction::creation(Poco::Dynamic::Var params)
{
	auto target_pubkey = getTargetPubkey(params);
	Poco::UInt32 amount = 0;
	Poco::DateTime target_date;
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		try {
			paramJsonObject->get("amount").convert(amount);
			paramJsonObject->get("target_date").convert(target_date);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}
	model::gradido::Transaction::createCreation(mSession->getNewUser(), amount, target_date, mMemo);
	return stateSuccess();

}
Poco::JSON::Object* JsonCreateTransaction::groupMemberUpdate(Poco::Dynamic::Var params)
{
	if (mTargetGroup.isNull()) {
		return stateError("target_group not found");
	}
	model::gradido::Transaction::createGroupMemberUpdate(mSession->getNewUser(), mTargetGroup);
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
	auto user = controller::User::create();
	int result_count = 0;
	
	MemoryBin* result = nullptr;
	if (email != "") {
		result_count = user->load(email);
	}
	else if (target_username != "") {
		int group_id = 0;
		if (!mTargetGroup.isNull()) {
			group_id = mTargetGroup->getModel()->getID();
		} else {
			mSession->getNewUser()->getModel()->getGroupId();
		}
		result_count = user->getModel()->loadFromDB({ "username", "group_id" }, target_username, group_id, model::table::MYSQL_CONDITION_AND);
	}
	else if (target_pubkey_hex != "") {
		result = DataTypeConverter::hexToBin(target_pubkey_hex);
	}
	if (1 == result_count) {
		result = user->getModel()->getPublicKeyCopy();
	}
	return result;
}

bool JsonCreateTransaction::getTargetGroup(Poco::Dynamic::Var params)
{
	std::string target_group_alias;
	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	try 
	{
		auto target_group = paramJsonObject->get("target_group");
		if (!target_group.isEmpty()) {
			target_group.convert(target_group_alias);
			auto groups = controller::Group::load(target_group_alias);
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