#include "JsonResetPassword.h"

#include "SingletonManager/SessionManager.h"
#include "SingletonManager/SingletonTaskObserver.h"

Poco::JSON::Object* JsonResetPassword::handle(Poco::Dynamic::Var params)
{
	auto result_session_check = checkAndLoadSession(params, false);
	if (result_session_check) {
		return result_session_check;
	}

	std::string password;
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		try {
			auto password_obj = paramJsonObject->get("password");
			if (password_obj.isEmpty()) {
				return stateError("password missing");
			}
			password_obj.convert(password);
		}
		catch (Poco::Exception& ex) {
			return stateError("error parsing json", ex.what());
		}
	}
	auto sm = SessionManager::getInstance();
	NotificationList errors;
	if (!sm->checkPwdValidation(password, &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
		return stateError("password isn't valid", &errors);
	}
	auto user = mSession->getNewUser();
	if (user.isNull() || user->getModel().isNull()) {
		return stateError("invalid user");
	}

	auto observer = SingletonTaskObserver::getInstance();
	auto email_hash = observer->makeHash(user->getModel()->getEmail());

	if (observer->getTaskCount(email_hash, TASK_OBSERVER_PASSWORD_CREATION) > 0) {
		return stateError("password encryption is already running");
	}

	auto update_password_result = user->setNewPassword(password);
	if (update_password_result == 2) {
		KeyPairEd25519* key_pair = NULL;
		if (!user->tryLoadPassphraseUserBackup(&key_pair)) {
			user->setGradidoKeyPair(key_pair);
		}
	}
	return stateSuccess();
}