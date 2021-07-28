#include "JsonResetPassword.h"

#include "SingletonManager/SessionManager.h"
#include "SingletonManager/SingletonTaskObserver.h"

using namespace rapidjson;

Document JsonResetPassword::handle(const Document& params)
{
	auto paramError = checkAndLoadSession(params);
	if (paramError.IsObject()) return paramError;

	std::string password;
	paramError = getStringParameter(params, "password", password);
	if (paramError.IsObject()) return paramError;

	auto sm = SessionManager::getInstance();
	NotificationList errors;
	if (!sm->checkPwdValidation(password, &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
		Document result(kObjectType);
		auto alloc = result.GetAllocator();
		result.AddMember("state", "error", alloc);
		result.AddMember("msg", Value(errors.getLastError()->getString(false).data(), alloc), alloc);
		if (errors.errorCount()) {
			result.AddMember("details", Value(errors.getLastError()->getString(false).data(), alloc), alloc);
		}
		return result;		
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