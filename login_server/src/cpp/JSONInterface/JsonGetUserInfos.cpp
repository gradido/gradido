#include "JsonGetUserInfos.h"

#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../ServerConfig.h"

using namespace rapidjson;

Poco::UInt64 JsonGetUserInfos::readOrCreateEmailVerificationCode(int user_id, model::table::EmailOptInType type)
{
	try {
		auto emailVerificationCode = controller::EmailVerificationCode::load(user_id, type);
		if (!emailVerificationCode) {
			emailVerificationCode = controller::EmailVerificationCode::create(user_id, type);
			UniLib::controller::TaskPtr insert = new model::table::ModelInsertTask(emailVerificationCode->getModel(), false);
			insert->scheduleTask(insert);
		}
		return emailVerificationCode->getModel()->getCode();
	}
	catch (Poco::Exception& ex) {
		NotificationList errors;
		//printf("exception: %s\n", ex.displayText().data());
		errors.addError(new ParamError("JsonGetUserInfos::readOrCreateEmailVerificationCode", "exception: ", ex.displayText()));
		errors.sendErrorsAsEmail();
	}
	return 0;
}

Document JsonGetUserInfos::handle(const Document& params)
{
	auto sm = SessionManager::getInstance();

	auto paramError = checkAndLoadSession(params);
	if (!paramError.IsNull()) { return paramError;}

	std::string email;
	paramError = getStringParameter(params, "email", email);
	if (!paramError.IsNull()) { return paramError; }

	
	paramError = checkArrayParameter(params, "ask");
	if (!paramError.IsNull()) { return paramError; }
	auto itr = params.FindMember("ask");
	const Value& ask = itr->value;

	auto session_user = mSession->getNewUser();
	auto session_user_model = session_user->getModel();
	bool isAdmin = false;
	bool emailBelongToUser = false;
	if (model::table::ROLE_ADMIN == session_user_model->getRole()) {
		isAdmin = true;
	}
	if (session_user_model->getEmail() == email) {
		emailBelongToUser = true;
	}

	auto user = controller::User::create();
	if (1 != user->load(email)) {
		return customStateError("not found", "user not found");
	}
	auto user_model = user->getModel();

	Document result(kObjectType);
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);
	Value jsonErrors(kArrayType);
	Value jsonUser(kObjectType);
	Value jsonServer(kObjectType);
	
	for (auto it = ask.Begin(); it != ask.End(); it++) 
	{
		if (!it->IsString()) {
			return stateError("ask array member isn't a string");
		}
		std::string parameterString(it->GetString(), it->GetStringLength());
		
		if (parameterString == "EmailVerificationCode.Register" && isAdmin && !emailBelongToUser) {
			auto code = readOrCreateEmailVerificationCode(user_model->getID(), model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
			if (code) {
				jsonUser.AddMember("EmailVerificationCode.Register", Value(std::to_string(code).data(), alloc), alloc);
			}
		}
		else if (parameterString == "loginServer.path") {
			jsonServer.AddMember("loginServer.path", Value(ServerConfig::g_serverPath.data(), alloc), alloc);
		}
		else if (parameterString == "user.pubkeyhex") {
			jsonUser.AddMember("pubkeyhex", Value(user_model->getPublicKeyHex().data(), alloc), alloc);
		}
		else if (parameterString == "user.first_name") {
			jsonUser.AddMember("first_name", Value(user_model->getFirstName().data(), alloc), alloc);
		}
		else if (parameterString == "user.last_name") {
			jsonUser.AddMember("last_name", Value(user_model->getLastName().data(), alloc), alloc);
		}
		else if (parameterString == "user.username") {
			jsonUser.AddMember("username", Value(user_model->getUsername().data(), alloc), alloc);
		}
		else if (parameterString == "user.description") {
			jsonUser.AddMember("description", Value(user_model->getDescription().data(), alloc), alloc);
		}
		else if (parameterString == "user.disabled") {
			jsonUser.AddMember("disabled", user_model->isDisabled(), alloc);
		}
		else if (parameterString == "user.email_checked" && (isAdmin || emailBelongToUser)) {
			jsonUser.AddMember("email_checked", user_model->isEmailChecked(), alloc);
		}
		else if (parameterString == "user.identHash") {
			auto email = user_model->getEmail();
			jsonUser.AddMember("identHash", DRMakeStringHash(email.data(), email.size()), alloc);
		}
		else if (parameterString == "user.language") {
			jsonUser.AddMember("language", Value(user_model->getLanguageKey().data(), alloc), alloc);
		}
		else if (parameterString == "user.publisher_id") {
			jsonUser.AddMember("publisher_id", user_model->getPublisherId(), alloc);
		}

	}
	result.AddMember("errors", jsonErrors, alloc);
	result.AddMember("userData", jsonUser, alloc);
	result.AddMember("server", jsonServer, alloc);
	return result;

}
