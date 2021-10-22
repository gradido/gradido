#include "JsonUpdateUserInfos.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"


JsonUpdateUserInfos::JsonUpdateUserInfos(Session* session)
	: JsonRequestHandler(session)
{

}

Poco::JSON::Object* JsonUpdateUserInfos::handle(Poco::Dynamic::Var params)
{
	/*
	'session_id' => $session_id,
	'update' => ['User.first_name' => 'first_name', 'User.last_name' => 'last_name', 'User.disabled' => 0|1, 'User.language' => 'de']
	*/
	// incoming
	int session_id = 0;
	std::string email;
	Poco::JSON::Object::Ptr updates;

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
			
			auto session_id_obj = paramJsonObject->get("session_id");
			if (!session_id_obj.isEmpty()) {
				session_id_obj.convert(session_id);
			}
			updates = paramJsonObject->getObject("update");
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	if (!session_id && !mSession) {
		return stateError("session_id invalid");
	}
	if (updates.isNull()) {
		return stateError("update is zero or not an object");
	}

	if (session_id) {
		mSession = sm->getSession(session_id);
	}
	
	if (!mSession) {
		return customStateError("not found", "session not found");
	}
	auto user = mSession->getNewUser();
	auto user_model = user->getModel();
		
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	Poco::JSON::Array  jsonErrorsArray;

	int extractet_values = 0;
	bool password_changed = false;
	//['User.first_name' => 'first_name', 'User.last_name' => 'last_name', 'User.disabled' => 0|1, 'User.language' => 'de']
	for (auto it = updates->begin(); it != updates->end(); it++) {
		std::string name = it->first; 
		auto value = it->second;


		try {
			if ( "User.first_name" == name) {
				std::string str_val = validateString(value, "User.first_name", jsonErrorsArray);
				
				if (str_val.size() > 0 && user_model->getFirstName() != str_val) {
					user_model->setFirstName(str_val);
					extractet_values++;
				}
			}
			else if ("User.last_name" == name ) {
				std::string str_val = validateString(value, "User.last_name", jsonErrorsArray);

				if (str_val.size() > 0 && user_model->getLastName() != str_val) {
					user_model->setLastName(str_val);
					extractet_values++;
				}
				
			}
			else if ("User.username" == name) {
				std::string str_val = validateString(value, "User.username", jsonErrorsArray);

				if (str_val.size() > 0 && user_model->getUsername() != str_val) {
					if (user_model->getUsername() != "") {
						jsonErrorsArray.add("change username currently not supported!");
					}
					else
					{
						if (user->isUsernameAlreadyUsed(str_val)) {
							jsonErrorsArray.add("username already used");
						}
						else if (!sm->isValid(str_val, VALIDATE_USERNAME)) {
							jsonErrorsArray.add("username must start with [a-z] or [A-Z] and than can contain also [0-9], - and _");
						}
						else {
							user_model->setUsername(str_val);
							extractet_values++;
						}
					}
				}
			}
			else if ("User.description" == name) {
				std::string errorMessage = "User.description";

				if (!value.isString()) {
					errorMessage += " isn't a string";
					jsonErrorsArray.add(errorMessage);
				}
				std::string str_val = value.toString();

				if (str_val != user_model->getDescription()) {
					user_model->setDescription(str_val);
					extractet_values++;
				}
			}
			else if ("User.disabled" == name) {
				bool disabled;

				if (value.isInteger()) {
					int idisabled;
					value.convert(idisabled);
					disabled = static_cast<bool>(idisabled);
				} else if (value.isBoolean()) {
					value.convert(disabled);
				}
				else {
					jsonErrorsArray.add("User.disabled isn't a boolean or integer");
				}
				if (user_model->isDisabled() != disabled) {
					user_model->setDisabled(disabled);
					extractet_values++;
				}
			}
			else if ("User.language" == name && value.size() > 0) 
			{
				std::string str_val = validateString(value, "User.language", jsonErrorsArray);

				if (str_val.size() > 0 && user_model->getLanguageKey() != str_val) {
					auto lang = LanguageManager::languageFromString(str_val);
					if (LANG_NULL == lang) {
						jsonErrorsArray.add("User.language isn't a valid language");
					}
					else {
						user_model->setLanguageKey(value.toString());
						extractet_values++;
					}
				}

			}
			else if ("User.publisher_id" == name) {
				if (value.isInteger()) {
					int publisher_id = 0;
					value.convert(publisher_id);
					if(user_model->getPublisherId() != publisher_id) {
						user_model->setPublisherId(publisher_id);
						extractet_values++;
					}
				}
				else {
					jsonErrorsArray.add("User.publisher_id isn't a valid integer");
				}
			}
			else if ("User.password" == name && (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS) == ServerConfig::UNSECURE_PASSWORD_REQUESTS) 
			{
				std::string str_val = validateString(value, "User.password", jsonErrorsArray);
				if (str_val.size() > 0) 
				{
					if (!user->hasPassword()) {
						return stateError("login state invalid");
					}
					if (isOldPasswordValid(updates, jsonErrorsArray))
					{
						NotificationList errors;
						if (!sm->checkPwdValidation(value.toString(), &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
							jsonErrorsArray.add("User.password isn't valid");
							jsonErrorsArray.add(errors.getErrorsArray());
						}
						else 
						{
							auto result_new_password = user->setNewPassword(value.toString());
						
							switch (result_new_password) {
								// 0 = new and current passwords are the same
								// 1 = password changed, private key re-encrypted and saved into db
							case 1: 
								extractet_values++; 
								password_changed = true; 
								break;
							// 2 = password changed, only hash stored in db, couldn't load private key for re-encryption
							case 2: 
								jsonErrorsArray.add("password changed, couldn't load private key for re-encryption"); 
								extractet_values++;
								password_changed = true;
								break;
							// -1 = stored pubkey and private key didn't match
							case -1: jsonErrorsArray.add("stored pubkey and private key didn't match"); break;
							}
						
						}
					}	
					
				}
			}
		}
		catch (Poco::Exception& ex) {
			std::string error_message = "exception by parsing json: ";
			error_message += ex.displayText();
			jsonErrorsArray.add(error_message);
		}
	}
	// if only password was changed, no need to call an additional db update
	// password db entry will be updated inside of controller::User::setNewPassword method
	if (extractet_values - (int)password_changed > 0) {
		if (1 != user_model->updateFieldsFromCommunityServer()) {
			user_model->addError(new Error("JsonUpdateUserInfos", "error by saving update to db"));
			user_model->sendErrorsAsEmail();
			return stateError("error saving to db");
		}
	}
	result->set("errors", jsonErrorsArray);
	result->set("valid_values", extractet_values);
	if (!jsonErrorsArray.size()) {
		result->set("state", "success");
	}
	else {
		result->set("msg", jsonErrorsArray.get(0));
		result->set("state", "error");
	}

	return result;
}

std::string JsonUpdateUserInfos::validateString(Poco::Dynamic::Var value, const char* fieldName, Poco::JSON::Array& errorArray)
{
	std::string errorMessage = fieldName;

	if (!value.isString()) {
		errorMessage += " isn't a string";
		errorArray.add(errorMessage);
		return "";
	}
	std::string string_value = value.toString();

	if (string_value.size() == 0) {
		errorMessage += " is empty";
		errorArray.add(errorMessage);
		return "";
	}
	return string_value;
}

bool JsonUpdateUserInfos::isOldPasswordValid(Poco::JSON::Object::Ptr updates, Poco::JSON::Array& errors)
{
	auto sm = SessionManager::getInstance();
	auto user = mSession->getNewUser();

	std::string old_password;

	auto old_password_obj = updates->get("User.password_old");
	if (old_password_obj.isEmpty()) {
		errors.add("User.password_old not found");
	}
	else if (!old_password_obj.isString()) {
		errors.add("User.password_old isn't a string");
	}
	else {
		old_password_obj.convert(old_password);
	}

	NotificationList local_errors;
	if (old_password.size())
	{	
		if (!sm->checkPwdValidation(old_password, &local_errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
			errors.add("User.password_old didn't match");
			Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
		}
		else
		{
			auto secret_key = user->createSecretKey(old_password);
			if (secret_key->getKeyHashed() == user->getModel()->getPasswordHashed()) {
				return true;
			}
			else if (secret_key.isNull()) {
				errors.add("Password calculation for this user already running, please try again later");
			}
			else {
				errors.add("User.password_old didn't match");
			}
		}

	}
	return false;
}