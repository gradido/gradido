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

	auto paramError = rcheckAndLoadSession(params);
	if (!paramError.IsNull()) { return paramError;}

	std::string email;
	paramError = getStringParameter(params, "email", email);
	if (!paramError.IsNull()) { return paramError; }

	Value ask;
	paramError = getArrayParameter(params, "ask", ask);
	if (!paramError.IsNull()) { return paramError; }

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
		return rcustomStateError("not found", "user not found");
	}
	auto user_model = user->getModel();

	Document result; result.SetObject();
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);
	Value jsonErrors; jsonErrors.SetArray();
	Value jsonUser; jsonUser.SetObject();
	Value jsonServer; jsonServer.SetObject();
	
	for (auto it = ask.Begin(); it != ask.End(); it++) 
	{
		if (!it->IsString()) {
			return rstateError("ask array member isn't a string");
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

	}
	result.AddMember("errors", jsonErrors, alloc);
	result.AddMember("userData", jsonUser, alloc);
	result.AddMember("server", jsonServer, alloc);
	return result;

}

Poco::JSON::Object* JsonGetUserInfos::handle(Poco::Dynamic::Var params)
{
	/*
	'session_id' => $session_id,
	'email' => $email,
	'ask' => ['EmailOptIn.Register']
	*/
	// incoming
	int session_id = 0;
	std::string email;
	Poco::JSON::Array::Ptr askArray;

	auto sm = SessionManager::getInstance();

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("email").convert(email);
			paramJsonObject->get("session_id").convert(session_id);
			askArray = paramJsonObject->getArray("ask");
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
	if (askArray.isNull()) {
		return stateError("ask is zero or not an array");
	}

	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "session not found");
	}

	auto session_user = session->getNewUser();
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

	
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	Poco::JSON::Array  jsonErrorsArray;
	Poco::JSON::Object jsonUser;
	Poco::JSON::Object jsonServer;

	for (auto it = askArray->begin(); it != askArray->end(); it++) {
		auto parameter = *it;
		std::string parameterString;
		try {
			parameter.convert(parameterString);
			if (parameterString == "EmailVerificationCode.Register" && isAdmin && !emailBelongToUser) {
				auto code = readOrCreateEmailVerificationCode(user_model->getID(), model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
				if (code) {
					jsonUser.set("EmailVerificationCode.Register", std::to_string(code));
					}
				}
			else if (parameterString == "loginServer.path") {
				jsonServer.set("loginServer.path", ServerConfig::g_serverPath);
			}
			else if (parameterString == "user.pubkeyhex") {
				jsonUser.set("pubkeyhex", user_model->getPublicKeyHex());
			}
			else if (parameterString == "user.first_name") {
				jsonUser.set("first_name", user_model->getFirstName());
			}
			else if (parameterString == "user.last_name") {
				jsonUser.set("last_name", user_model->getLastName());
			}
			else if (parameterString == "user.username") {
				jsonUser.set("username", user_model->getUsername());
			}
			else if (parameterString == "user.description") {
				jsonUser.set("description", user_model->getDescription());
			}
			else if (parameterString == "user.disabled") {
				jsonUser.set("disabled", user_model->isDisabled());
			}
			else if (parameterString == "user.email_checked" && (isAdmin || emailBelongToUser)) {
				jsonUser.set("email_checked", user_model->isEmailChecked());
			}
			else if (parameterString == "user.identHash") {
				auto email = user_model->getEmail();
				jsonUser.set("identHash", DRMakeStringHash(email.data(), email.size()));
			}
			else if (parameterString == "user.language") {
				jsonUser.set("language", user_model->getLanguageKey());
			}
		}
		catch (Poco::Exception& ex) {
			jsonErrorsArray.add("ask parameter invalid");
		}
	}
	result->set("errors", jsonErrorsArray);
	result->set("userData", jsonUser);
	result->set("server", jsonServer);
	return result;
	
}