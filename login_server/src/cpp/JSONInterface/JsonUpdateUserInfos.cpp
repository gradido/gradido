#include "JsonUpdateUserInfos.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"

using namespace rapidjson;

Document JsonUpdateUserInfos::handle(const Document& params)
{
	auto paramError = rcheckAndLoadSession(params);
	if (paramError.IsObject()) return paramError;

	std::string email;
	getStringParameter(params, "email", email);

	paramError = checkObjectParameter(params, "ask");
	if (paramError.IsObject()) { return paramError; }
	auto itr = params.FindMember("update");
	const Value& updates = itr->value;

	auto user = mSession->getNewUser();
	auto user_model = user->getModel();
	if (email.size() && user_model->getRole() == model::table::ROLE_ADMIN && user_model->getEmail() != email) {
		user = controller::User::create();
		if (user->load(email) != 1) {
			return rstateError("email not found");
		};
		user_model = user->getModel();
	}
	
	Document result(kObjectType);
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);

	auto sm = SessionManager::getInstance();

	Value jsonErrors(kArrayType);

	int extractet_values = 0;
	bool password_changed = false;
	//['User.first_name' => 'first_name', 'User.last_name' => 'last_name', 'User.disabled' => 0|1, 'User.language' => 'de']
	for (auto it = updates.MemberBegin(); it != updates.MemberEnd(); it++) {
		if (!it->name.IsString()) {
			return rstateError("update key isn't string");
		}
		std::string name(it->name.GetString(), it->name.GetStringLength());
		std::string str_value;
		bool b_value = false;
		int i_value = 0;
		if (it->value.IsString()) {
			str_value = std::string(it->value.GetString(), it->value.GetStringLength());
		}
		else if (it->value.IsBool()) {
			b_value = it->value.GetBool();
		} 
		else if (it->value.IsInt()) {
			i_value = it->value.GetInt();
		}

		
		if ("User.first_name" == name) 
		{
			if (str_value.size() > 0 && user_model->getFirstName() != str_value) {
				user_model->setFirstName(str_value);
				extractet_values++;
			}
			else {
				jsonErrors.PushBack("User.first_name value isn't valid string", alloc);
			}
		}
		else if ("User.last_name" == name) 
		{	
			if (str_value.size() > 0 && user_model->getLastName() != str_value) {
				user_model->setLastName(str_value);
				extractet_values++;
			}
			else {
				jsonErrors.PushBack("User.last_name value isn't valid string", alloc);
			}
		}
		else if ("User.username" == name) 
		{
			if (str_value.size() > 0 && user_model->getUsername() != str_value) {
				if (user_model->getUsername() != "") {
					jsonErrors.PushBack("change username currently not supported!", alloc);
				}
				else
				{
					if (user->isUsernameAlreadyUsed(str_value)) {
						jsonErrors.PushBack("username already used", alloc);
					}
					else if (!sm->isValid(str_value, VALIDATE_USERNAME)) {
						jsonErrors.PushBack("username must start with [a-z] or [A-Z] and than can contain also [0-9], - and _", alloc);
					}
					else {
						user_model->setUsername(str_value);
						extractet_values++;
					}
				}
			}
		}
		else if ("User.description" == name) 
		{
			if (!it->value.IsString() && !it->value.IsNull()) {
				jsonErrors.PushBack("User.description isn't a valid string", alloc);
			}
			else if (str_value != user_model->getDescription()) {
				user_model->setDescription(str_value);
				extractet_values++;
			}
		}
		else if ("User.disabled" == name) 
		{
			bool disabled;

			if (it->value.IsInt()) {
				disabled = static_cast<bool>(i_value);
			}
			else if (it->value.IsBool()) {
				disabled = b_value;
			}
			else if (it->value.IsNull()) {
				disabled = false;
			}
			else {
				jsonErrors.PushBack("User.disabled isn't a boolean or integer", alloc);
			}
			if (user_model->isDisabled() != disabled) {
				user_model->setDisabled(disabled);
				extractet_values++;
			}
		}
		else if ("User.language" == name)
		{
			if (str_value.size() > 0 && user_model->getLanguageKey() != str_value) {
				auto lang = LanguageManager::languageFromString(str_value);
				if (LANG_NULL == lang) {
					jsonErrors.PushBack("User.language isn't a valid language", alloc);
				}
				else {
					user_model->setLanguageKey(str_value);
					extractet_values++;
				}
			}

		}
		else if ("User.password" == name && (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS) == ServerConfig::UNSECURE_PASSWORD_REQUESTS)
		{
			if (str_value.size() > 0)
			{
				if (!user->hasPassword()) {
					return rstateError("login state invalid");
				}
				if (isOldPasswordValid(updates, jsonErrors, alloc))
				{
					NotificationList errors;
					if (!sm->checkPwdValidation(str_value, &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
						jsonErrors.PushBack("User.password isn't valid", alloc);
						jsonErrors.PushBack(errors.getErrorsArray(alloc), alloc);
					}
					else
					{
						auto result_new_password = user->setNewPassword(str_value);

						switch (result_new_password) {
							// 0 = new and current passwords are the same
							// 1 = password changed, private key re-encrypted and saved into db
						case 1:
							extractet_values++;
							password_changed = true;
							break;
							// 2 = password changed, only hash stored in db, couldn't load private key for re-encryption
						case 2:
							jsonErrors.PushBack("password changed, couldn't load private key for re-encryption", alloc);
							extractet_values++;
							password_changed = true;
							break;
							// -1 = stored pubkey and private key didn't match
						case -1: jsonErrors.PushBack("stored pubkey and private key didn't match", alloc); break;
						}
					}
				}

			}
		}
	}
	// if only password was changed, no need to call an additional db update
	// password db entry will be updated inside of controller::User::setNewPassword method
	if (extractet_values - (int)password_changed > 0) {
		if (1 != user_model->updateFieldsFromCommunityServer()) {
			user_model->addError(new Error("JsonUpdateUserInfos", "error by saving update to db"));
			user_model->sendErrorsAsEmail();
			return rstateError("error saving to db");
		}
	}
	
	result.AddMember("valid_values", extractet_values, alloc);
	if (!jsonErrors.Size()) {
		result.AddMember("state", "success", alloc);
	}
	else if (jsonErrors.Size() == 1) {
		result.AddMember("msg", jsonErrors.PopBack().Move(), alloc);
		result.AddMember("state", "error", alloc);
	}
	else {
		result.AddMember("msg", "errors occured", alloc);
		result.AddMember("errors", jsonErrors, alloc);
		result.AddMember("state", "error", alloc);
	}

	return result;
}

bool JsonUpdateUserInfos::isOldPasswordValid(const rapidjson::Value& updates, rapidjson::Value& errors, rapidjson::Document::AllocatorType& alloc)
{
	auto sm = SessionManager::getInstance();
	auto user = mSession->getNewUser();

	std::string old_password;

	auto it = updates.FindMember("User.password_old");
	
	if (it == updates.MemberEnd()) {
		errors.PushBack("User.password_old not found", alloc);
	}
	else if (!it->value.IsString()) {
		errors.PushBack("User.password_old isn't a string", alloc);
	}
	else {
		old_password = std::string(it->value.GetString(), it->value.GetStringLength());
	}

	NotificationList local_errors;
	if (old_password.size())
	{
		if (!sm->checkPwdValidation(old_password, &local_errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
			errors.PushBack("User.password_old didn't match", alloc);
			Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
		}
		else
		{
			auto secret_key = user->createSecretKey(old_password);
			if (secret_key->getKeyHashed() == user->getModel()->getPasswordHashed()) {
				return true;
			}
			else if (secret_key.isNull()) {
				errors.PushBack("Password calculation for this user already running, please try again later", alloc);
			}
			else {
				errors.PushBack("User.password_old didn't match", alloc);
			}
		}

	}
	return false;
}
