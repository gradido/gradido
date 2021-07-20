#include "JsonCreateUser.h"

#include "../model/email/Email.h"
#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../SingletonManager/EmailManager.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"

#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"

using namespace rapidjson;

Document JsonCreateUser::handle(const Document& params)
{
	std::string email, firstName, lastName, password, username, description, language;
	bool loginAfterRegister = false, groupWasNotSet = false;
	int emailType;
	int group_id = 1;
	int publisher_id = 0;

	auto sm = SessionManager::getInstance();
	auto em = EmailManager::getInstance();

	auto paramError = getStringParameter(params, "email", email);
	if (paramError.IsObject()) { return paramError; }
			auto language_obj = paramJsonObject->get("language");

	auto user = controller::User::create();
	if (user->load(email) > 0) {
		return rcustomStateError("exist", "user already exist");
	}

	paramError = getStringParameter(params, "password", password);
	if (paramError.IsObject()) { return paramError; }

	if (password.size()) {
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
	}

	if (!getTargetGroup(params)) {
		mTargetGroup = controller::Group::load(1);
		groupWasNotSet = true;
	}
	

	paramError = getStringParameter(params, "first_name", firstName);
	if (paramError.IsObject()) { return paramError; }

	paramError = getStringParameter(params, "last_name", lastName);
	if (paramError.IsObject()) { return paramError; }

	user = controller::User::create(email, firstName, lastName, mTargetGroup->getModel()->getID());

	getStringParameter(params, "username", username);
	
	auto user_model = user->getModel();
	if (username.size() > 3) {
		if (user->isUsernameAlreadyUsed(username)) {
			return rstateError("username already in use");
		}
		user_model->setUsername(username);
	}

	getStringParameter(params, "description", description);
	if (description.size() > 3) {
		user_model->setDescription(description);
	}
	if (LanguageManager::languageFromString(language) != LANG_NULL) {
		user_model->setLanguageKey(language);
	}
	user_model->setPublisherId(publisher_id);
	
	auto userModel = user->getModel();
	Session* session = nullptr;

	if (!userModel->insertIntoDB(true)) {
		userModel->sendErrorsAsEmail();
		return rstateError("insert user failed");
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
		return rstateError("insert emailOptIn failed");
	}
	emailOptIn->setBaseUrl(user->getGroupBaseUrl() + ServerConfig::g_frontend_checkEmailPath);

	paramError = getIntParameter(params, "emailType", emailType);
	if (paramError.IsObject()) { return paramError; }

	auto email_type = model::Email::convertTypeFromInt(emailType);
	if (email_type == model::EMAIL_ERROR) {
		return rstateError("email type is invalid");
	}

	em->addEmail(new model::Email(emailOptIn, user, email_type));

	getBoolParameter(params, "login_after_register", loginAfterRegister);

	Document result(kObjectType); 
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);

	if (groupWasNotSet) {
		result.AddMember("info", "group_id was not set, use 1 as default!", alloc);
	}

	if (loginAfterRegister && session) {	
		result.AddMember("session_id", session->getHandle(), alloc);
	}

	return result;
}
