#include "JsonCreateUser.h"

#include "../model/email/Email.h"
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../SingletonManager/EmailManager.h"
#include "../SingletonManager/SessionManager.h"

#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"

Poco::JSON::Object* JsonCreateUser::handle(Poco::Dynamic::Var params)
{
	std::string email;
	std::string first_name;
	std::string last_name;
	std::string password;
	bool login_after_register = false;
	int emailType;
	int group_id = 1;
	bool group_was_not_set = false;

	auto em = EmailManager::getInstance();
	auto sm = SessionManager::getInstance();
    printf("enter\n");
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
			paramJsonObject->get("first_name").convert(first_name);
			paramJsonObject->get("last_name").convert(last_name);
			paramJsonObject->get("emailType").convert(emailType);
			auto group_id_obj = paramJsonObject->get("group_id");

			if(!group_id_obj.isEmpty()) {
                group_id_obj.convert(group_id);
			}

			if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS)) {
				paramJsonObject->get("password").convert(password);
			}
			if (!paramJsonObject->isNull("login_after_register")) {
				paramJsonObject->get("login_after_register").convert(login_after_register);
			}
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	auto user = controller::User::create();
	if (user->load(email) > 0) {
		/*Poco::JSON::Object* result = new Poco::JSON::Object;
		result->set("state", "exist");
		result->set("msg", "user already exist");
		return result;*/
		return customStateError("exist", "user already exist");
	}

	if (password.size()) {
		NotificationList errors;
		if (!sm->checkPwdValidation(password, &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
			Poco::JSON::Object* result = new Poco::JSON::Object;
			result->set("state", "error");
			result->set("msg", errors.getLastError()->getString(false));
			if (errors.errorCount()) {
				result->set("details", errors.getLastError()->getString(false));
			}
			return result;
		}
	}

	// create user
	if(!group_id) {
        group_id = 1;
        group_was_not_set = true;
	}
	user = controller::User::create(email, first_name, last_name, group_id);
	auto userModel = user->getModel();
	Session* session = nullptr;

	if (!userModel->insertIntoDB(true)) {
		userModel->sendErrorsAsEmail();
		return stateError("insert user failed");
	}
	if (password.size()) {
		session = sm->getNewSession();
		session->setUser(user);
		session->generateKeys(true, true);
		session->setClientIp(mClientIP);

		// calculate encryption key, could need some time, will save encrypted privkey to db
		UniLib::controller::TaskPtr create_authenticated_encrypten_key = new AuthenticatedEncryptionCreateKeyTask(user, password);
		create_authenticated_encrypten_key->scheduleTask(create_authenticated_encrypten_key);
	}

	auto emailOptIn = controller::EmailVerificationCode::create(userModel->getID(), model::table::EMAIL_OPT_IN_REGISTER);
	auto emailOptInModel = emailOptIn->getModel();
	if (!emailOptInModel->insertIntoDB(false)) {
		emailOptInModel->sendErrorsAsEmail();
		return stateError("insert emailOptIn failed");
	}
	emailOptIn->setBaseUrl(user->getGroupBaseUrl() + ServerConfig::g_frontend_checkEmailPath);
	em->addEmail(new model::Email(emailOptIn, user, model::Email::convertTypeFromInt(emailType)));

	if (login_after_register && session) {
		Poco::JSON::Object* result = stateSuccess();
        if(group_was_not_set) {
            Poco::JSON::Array infos;
            infos.add("group_id was not set, use 1 as default!");
            result->set("info", infos);
        }
		result->set("session_id", session->getHandle());
		return result;
	}

	return stateSuccess();
}
