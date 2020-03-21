#include "JsonGetUserInfos.h"

#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

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
	Poco::Dynamic::Var ask;

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
			ask = paramJsonObject->get("ask");
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

	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "session not found");
	}

	auto user = controller::User::create();
	if (1 != user->load(email)) {
		return customStateError("not found", "user not found");
	}
	auto userModel = user->getModel();
	if (ask.isArray()) {
		Poco::JSON::Object* result = new Poco::JSON::Object;
		result->set("state", "success");
		Poco::JSON::Array  jsonErrorsArray;
		Poco::JSON::Object jsonUser;

		for (auto it = ask.begin(); it != ask.end(); it++) {
			auto parameter = *it;
			if (parameter.isString()) {
				std::string parameterString;
				try {
					parameter.convert(parameterString);
					if (parameterString == "EmailOptIn.Register") {
						try {
							auto emailVerificationCode = controller::EmailVerificationCode::load(
								userModel->getID(), model::table::EMAIL_OPT_IN_REGISTER
							);
							jsonUser.set("verificationCode", std::to_string(emailVerificationCode->getModel()->getCode()));
						}
						catch (...) {

						}

					}
				}
				catch (Poco::Exception& ex) {
					jsonErrorsArray.add("ask parameter invalid");
				}
			}
		}
		result->set("errors", jsonErrorsArray);
		result->set("userData", jsonUser);
		return result;
	}
	else {
		return stateError("ask isn't a array");
	}
}