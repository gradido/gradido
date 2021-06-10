#include "JsonUpdateUserInfos.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/LanguageManager.h"
#include "../tasks/AuthenticatedEncryptionCreateKeyTask.h"

Poco::JSON::Object* JsonUpdateUserInfos::handle(Poco::Dynamic::Var params)
{
	/*
	'session_id' => $session_id,
	'email' => $email,
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
			paramJsonObject->get("email").convert(email);
			paramJsonObject->get("session_id").convert(session_id);
			updates = paramJsonObject->getObject("update");
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
	if (updates.isNull()) {
		return stateError("update is zero or not an object");
	}

	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "session not found");
	}
	auto user = session->getNewUser();
	auto user_model = user->getModel();
	if (user_model->getEmail() != email) {
		return customStateError("not same", "email don't belong to logged in user");
	}
	
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	Poco::JSON::Array  jsonErrorsArray;

	int extractet_values = 0;
	//['User.first_name' => 'first_name', 'User.last_name' => 'last_name', 'User.disabled' => 0|1, 'User.language' => 'de']
	for (auto it = updates->begin(); it != updates->end(); it++) {
		std::string name = it->first; 
		auto value = it->second;


		try {
			if ( "User.first_name" == name && value.size() > 0) {
				if (!value.isString()) {
					jsonErrorsArray.add("User.first_name isn't a string");
				}
				else {
					user_model->setFirstName(value.toString());
					extractet_values++;
				}
			}
			else if ("User.last_name" == name && value.size() > 0) {
				if (!value.isString()) {
					jsonErrorsArray.add("User.last_name isn't a string");
				}
				else {
					user_model->setLastName(value.toString());
					extractet_values++;
				}
			}
			else if ("User.username" == name && value.size() > 3) {
				if (!value.isString()) {
					jsonErrorsArray.add("User.username isn't a string");
				}
				else {
					auto new_username = value.toString();
					if (user_model->getUsername() != new_username) {
						if (user->isUsernameAlreadyUsed(new_username)) {
							jsonErrorsArray.add("username already used");
						}
						else {
							user_model->setUsername(new_username);
							extractet_values++;
						}
					}
				}
			}
			else if ("User.description" == name && value.size() > 3) {
				if (!value.isString()) {
					jsonErrorsArray.add("description isn't a string");
				}
				else {
					user_model->setDescription(value.toString());
					extractet_values++;
				}
			}
			else if ("User.disabled" == name) {
				if (value.isBoolean()) {
					bool disabled;
					value.convert(disabled);
					user_model->setDisabled(disabled);
					extractet_values++;
				}
				else if (value.isInteger()) {
					int disabled;
					value.convert(disabled);
					user_model->setDisabled(static_cast<bool>(disabled));
					extractet_values++;
				}
				else {
					jsonErrorsArray.add("User.disabled isn't a boolean or integer");
				}
			}
			else if ("User.language" == name && value.size() > 0) {
				if (!value.isString()) {
					jsonErrorsArray.add("User.language isn't a string");
				}
				else {
					auto lang = LanguageManager::languageFromString(value.toString());
					if (LANG_NULL == lang) {
						jsonErrorsArray.add("User.language isn't a valid language");
					}
					else {
						user_model->setLanguageKey(value.toString());
						extractet_values++;
					}
				}
			}
			else if ("User.password" == name && value.size() > 0 && (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS) == ServerConfig::UNSECURE_PASSWORD_REQUESTS) {
				if (!value.isString()) {
					jsonErrorsArray.add("User.password isn't string");
				}
				else {
					std::string old_password;
					auto old_password_obj = updates->get("User.password_old");
					if (old_password_obj.isEmpty()) {
						jsonErrorsArray.add("User.password_old not found");
					}
					else if (!old_password_obj.isString()) {
						jsonErrorsArray.add("User.password_old isn't a string");
					}
					else {
						old_password_obj.convert(old_password);
					}

					bool old_password_valid = false;
					NotificationList errors;
					if (old_password.size()) 
					{
						if (!sm->checkPwdValidation(old_password, &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
							jsonErrorsArray.add("User.password_old didn't match");
							Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
						}
						else 
						{
							auto result = user->login(old_password);
							if (result == 1) {
								old_password_valid = true;
							}
							else if (result == -3) {
								jsonErrorsArray.add("Password calculation for this user already running, please try again later");
							}
							else {
								jsonErrorsArray.add("User.password_old didn't match");
							}
							
							if (result == 2) {
								Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
							}
						}

					}
					if (old_password_valid) 
					{
						if (!sm->checkPwdValidation(value.toString(), &errors, LanguageManager::getInstance()->getFreeCatalog(LANG_EN))) {
							jsonErrorsArray.add("User.password isn't valid");
							jsonErrorsArray.add(errors.getErrorsArray());
						}
						else 
						{
							auto result_new_password = user->setNewPassword(value.toString());

							switch (result_new_password) {
								// 0 = new and current passwords are the same
							case 0: jsonErrorsArray.add("new password is the same as old password"); break;
								// 1 = password changed, private key re-encrypted and saved into db
							//case 1: extractet_values++; break;
								// 2 = password changed, only hash stored in db, couldn't load private key for re-encryption
							case 2: jsonErrorsArray.add("password changed, couldn't load private key for re-encryption");  break;
								// -1 = stored pubkey and private key didn't match
							case -1: jsonErrorsArray.add("stored pubkey and private key didn't match"); break;
							}

						}
					}	
					
				}
			}
		}
		catch (Poco::Exception& ex) {
			jsonErrorsArray.add("update parameter invalid");
		}
	}
	if (extractet_values > 0) {
		if (1 != user_model->updateFieldsFromCommunityServer()) {
			user_model->addError(new Error("JsonUpdateUserInfos", "error by saving update to db"));
			user_model->sendErrorsAsEmail();
			return stateError("error saving to db");
		}
	}
	result->set("errors", jsonErrorsArray);
	result->set("valid_values", extractet_values);
	result->set("state", "success");

	return result;
}