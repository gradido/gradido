#include "JsonGetUserInfos.h"

#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"


#include "../ServerConfig.h"

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
	std::string username;
	std::string pubkey;
	Poco::AutoPtr<controller::Group> userGroup;
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
			copyValueIfExist(paramJsonObject, "email", email);
			copyValueIfExist(paramJsonObject, "username", username);
			copyValueIfExist(paramJsonObject, "session_id", session_id);
			copyValueIfExist(paramJsonObject, "pubkey", pubkey);

			if (username.size()) {
				userGroup = getTargetGroup(paramJsonObject);
			}
			
			askArray = paramJsonObject->getArray("ask");
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	if (askArray.isNull()) {
		return stateError("ask is zero or not an array");
	}

	bool isAdmin = false;
	bool emailBelongToUser = false;
	bool isLoggedIn = false;
	auto session = sm->getSession(session_id);
	if (session) {
		auto session_user = session->getNewUser();
		auto session_user_model = session_user->getModel();

		if (model::table::ROLE_ADMIN == session_user_model->getRole()) {
			isAdmin = true;
		}
		if (session_user_model->getEmail() == email) {
			emailBelongToUser = true;
		}
		isLoggedIn = true;
	}
	
	auto user = controller::User::create();
	if (email.size() && 1 != user->load(email)) {
		return customStateError("not found", "user not found by email");
	}
	else if (username.size()) {
		if (userGroup.isNull()) {
			return customStateError("not found", "invalid group, please specify group_alias or group_id");
		}
		if (1 != user->load(username, userGroup->getModel()->getID())) {
			return customStateError("not found", "user not found by username");
		}
	}
	else if (pubkey.size()) {
		auto pubkey_bin = DataTypeConverter::hexToBin(pubkey);
		if (1 != user->load(pubkey_bin->data())) {
			return customStateError("not found", "user not found by public key");
		}
		MemoryManager::getInstance()->releaseMemory(pubkey_bin);
	}
	if (user.isNull()) {
		if (session && !session->getNewUser().isNull()) {
			user = session->getNewUser();
		}
		else {
			return customStateError("not found", "no infos which user");
		}
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
			else if (parameterString == "user.first_name" && isLoggedIn) {
				jsonUser.set("first_name", user_model->getFirstName());
			}
			else if (parameterString == "user.last_name" && isLoggedIn) {
				jsonUser.set("last_name", user_model->getLastName());
			}
			else if (parameterString == "user.email" && isLoggedIn) {
				jsonUser.set("email", user_model->getEmail());
			}
			else if (parameterString == "user.username") {
				jsonUser.set("username", user_model->getUsername());
			}
			else if (parameterString == "user.description" && isLoggedIn) {
				jsonUser.set("description", user_model->getDescription());
			}
			else if (parameterString == "user.disabled") {
				jsonUser.set("disabled", user_model->isDisabled());
			}
			else if (parameterString == "user.email_checked" && (isAdmin || emailBelongToUser)) {
				jsonUser.set("email_checked", user_model->isEmailChecked());
			}
			else if (parameterString == "user.identHash" && isLoggedIn) {
				auto email = user_model->getEmail();
				jsonUser.set("identHash", DRMakeStringHash(email.data(), email.size()));
			}
			else if (parameterString == "user.language" && isLoggedIn) {
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