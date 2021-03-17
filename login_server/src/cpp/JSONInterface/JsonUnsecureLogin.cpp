#include "JsonUnsecureLogin.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonUnsecureLogin::handle(Poco::Dynamic::Var params)
{

	auto sm = SessionManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();
	auto em = ErrorManager::getInstance();

	/*
		'username', 'password'
	*/
	// incoming

	std::string email;
	std::string password;

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
			paramJsonObject->get("password").convert(password);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}


	if (!email.size() || !sm->isValid(email, VALIDATE_EMAIL)) {
		return stateError("invalid or empty email");
	}
	auto user = controller::User::create();
	if (1 != user->load(email)) {
		return stateError("user with email not found", email);
	}

	ErrorList pwd_errors;
	Poco::JSON::Object* result = new Poco::JSON::Object;

	if (!password.size() || !sm->checkPwdValidation(password, &pwd_errors)) {
	
		result->set("state", "error");
		result->set("msg", pwd_errors.getLastError()->getString(false));
		if (pwd_errors.errorCount()) {
			result->set("details", pwd_errors.getLastError()->getString(false));
		}
		return result;
	}
	
	auto session = sm->getNewSession();
	/*
		USER_EMPTY,
		USER_LOADED_FROM_DB,
		USER_PASSWORD_INCORRECT,
		USER_PASSWORD_ENCRYPTION_IN_PROCESS,
		USER_EMAIL_NOT_ACTIVATED,
		USER_NO_KEYS,
		USER_NO_PRIVATE_KEY,
		USER_KEYS_DONT_MATCH,
		USER_COMPLETE,
		USER_DISABLED
	*/
	auto user_state = session->loadUser(email, password);
	
	switch (user_state) {
	case USER_EMPTY:
	case USER_PASSWORD_INCORRECT:
		result->set("state", "error");
		result->set("msg", "password incorrect");
		break;
	case USER_PASSWORD_ENCRYPTION_IN_PROCESS:
		result->set("state", "processing");
		result->set("msg", "password encryption in process");
		break;
	case USER_KEYS_DONT_MATCH:
		result->set("state", "error");
		result->set("msg", "saved keys mismatch");
		break;
	case USER_DISABLED:
		result->set("state", "disabled");
		result->set("msg", "user is disabled");
		break;
	case USER_NO_PRIVATE_KEY:
	case USER_COMPLETE:
	case USER_EMAIL_NOT_ACTIVATED:
		result->set("state", "success");
		result->set("session_id", session->getHandle());
		session->setClientIp(mClientIP);
		return result;
	}
	
	sm->releaseSession(session);
	
	return result;

}