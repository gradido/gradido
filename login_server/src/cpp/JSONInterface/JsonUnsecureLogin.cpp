#include "JsonUnsecureLogin.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "../model/table/ElopageBuy.h"

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
	std::string username;
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
			//paramJsonObject->get("email").convert(email);
			paramJsonObject->get("password").convert(password);
			auto email_obj = paramJsonObject->get("email");
			auto username_obj = paramJsonObject->get("username");

			if (!email_obj.isEmpty()) {
				email_obj.convert(email);
			}
			if (!username_obj.isEmpty()) {
				username_obj.convert(username);
			}
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	if (!email.size() && !username.size()) {
		return stateError("no email or username given");
	}
	
	auto user = controller::User::create();
	std::string message;
	std::string details;
	if (email.size()) {
		if (!sm->isValid(email, VALIDATE_EMAIL)) {
			message = "invalid email";
		}
		if (1 != user->load(email)) {
			message = "user with email not found";
			details = email;
		}
	}
	else if (username.size() > 0) {
		if (1 != user->load(username)) {
			message = "user with username not found";
			details = username;
		}
		email = user->getModel()->getEmail();
	}
	if (message.size()) {
		Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
		return stateError(message.data(), details);
	}

	NotificationList pwd_errors;
	Poco::JSON::Object* result = new Poco::JSON::Object;

	if (!password.size() || !sm->checkPwdValidation(password, &pwd_errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
		Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
		result->set("state", "error");
		result->set("msg", "password incorrect");
		
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
	// run query for checking if user has already an account async
	Poco::AutoPtr<model::table::UserHasElopageTask> hasElopageTask = new model::table::UserHasElopageTask(email);
	hasElopageTask->scheduleTask(hasElopageTask);

	auto user_state = session->loadUser(email, password);
	auto user_model = session->getNewUser()->getModel();
	Poco::JSON::Array infos;

	// AUTOMATIC ERROR CORRECTION
	// if something went wrong by initial key generation for user, generate keys again
	if (user_state >= USER_LOADED_FROM_DB && !user_model->getPublicKey()) {
		if (session->generateKeys(true, true)) {
			user_state = session->getNewUser()->getUserState();
		}
	}
	
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
	case USER_NO_GROUP: 
		user_model->setGroupId(1);
		user_model->updateIntoDB("group_id", 1);
		infos.add("set user.group_id to default group_id = 1");
	case USER_NO_PRIVATE_KEY:
	case USER_COMPLETE:
		result->set("state", "success");
		result->set("user", session->getNewUser()->getJson());
		result->set("session_id", session->getHandle());
		session->setClientIp(mClientIP);
		if(infos.size() > 0) {
			result->set("info", infos);
		}		
		AWAIT(hasElopageTask)
		result->set("hasElopage", hasElopageTask->hasElopage());
		return result;
	case USER_EMAIL_NOT_ACTIVATED:
		result->set("state", "processing");
		result->set("msg", "user email not validated");
		break;
	default: 
		result->set("state", "error");
		result->set("msg", "unknown user state");
		result->set("details", user_state);
	}
	
	sm->releaseSession(session);
	
	return result;
}