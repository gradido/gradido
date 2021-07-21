#include "JsonUnsecureLogin.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "../model/table/ElopageBuy.h"
using namespace rapidjson;

Document JsonUnsecureLogin::handle(const Document& params)
{
	auto sm = SessionManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();
	auto em = ErrorManager::getInstance();

	std::string email;
	getStringParameter(params, "email", email);
	
	std::string username;
	getStringParameter(params, "username", username);

	std::string password;
	auto paramError = getStringParameter(params, "password", password);
	if(paramError.IsObject()) return paramError;

	if (!email.size() && !username.size()) {
		return rstateError("no email or username given");
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
		return rstateError(message.data(), details);
	}

	NotificationList pwd_errors;
	Document result(kObjectType);
	auto alloc = result.GetAllocator();

	mSession = sm->getNewSession();
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

	auto user_state = mSession->loadUser(email, password);
	auto user_model = mSession->getNewUser()->getModel();
    Value infos(kArrayType);

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
		result.AddMember("state", "error", alloc);
		result.AddMember("msg", "password incorrect", alloc);
		break;
	case USER_PASSWORD_ENCRYPTION_IN_PROCESS:
		result.AddMember("state", "processing", alloc);
		result.AddMember("msg", "password encryption in process", alloc);
		break;
	case USER_KEYS_DONT_MATCH:
		result.AddMember("state", "error", alloc);
		result.AddMember("msg", "saved keys mismatch", alloc);
		break;
	case USER_DISABLED:
		result.AddMember("state", "disabled", alloc);
		result.AddMember("msg", "user is disabled", alloc);
		break;
	case USER_NO_GROUP:
		user_model->setGroupId(1);
		user_model->updateIntoDB("group_id", 1);
		infos.PushBack("set user.group_id to default group_id = 1", alloc);
	case USER_NO_PRIVATE_KEY:
	case USER_COMPLETE:
	case USER_EMAIL_NOT_ACTIVATED:
		result.AddMember("state", "success", alloc);
		result.AddMember("user", mSession->getNewUser()->getJson(alloc), alloc);
		result.AddMember("session_id", mSession->getHandle(), alloc);
		mSession->setClientIp(mClientIp);
		if (infos.Size()) {
			result.AddMember("info", infos, alloc);
		}		
		AWAIT(hasElopageTask)
		result->set("hasElopage", hasElopageTask->hasElopage());
		return result;
	default:
		result.AddMember("state", "error", alloc);
		result.AddMember("msg", "unknown user state", alloc);
		result.AddMember("details", user_state, alloc);
	}

	sm->releaseSession(mSession);

	return result;
	
}
