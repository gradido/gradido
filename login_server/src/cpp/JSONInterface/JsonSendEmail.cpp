#include "JsonSendEmail.h"

#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"
#include "../SingletonManager/LanguageManager.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonSendEmail::handle(Poco::Dynamic::Var params)
{
	int session_id = 0;
	std::string email;
	model::EmailType emailType = model::EMAIL_DEFAULT;
	model::table::EmailOptInType emailVerificationCodeType;
	std::string emailCustomText;
	std::string emailCustomSubject;
	std::string languageCode;

	std::string email_verification_code_type_string;
	std::string email_type_string;
	int email_type_int = 0;
	
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {

			if (paramJsonObject->has("session_id")) {
				paramJsonObject->get("session_id").convert(session_id);
			}
			
			if (paramJsonObject->has("email_custom_text")) {
				paramJsonObject->get("email_custom_text").convert(emailCustomText);
			}
			if (paramJsonObject->has("email_custom_subject")) {
				paramJsonObject->get("email_custom_subject").convert(emailCustomSubject);
			}
			if (paramJsonObject->has("language")) {
				paramJsonObject->get("language").convert(languageCode);
			}
			paramJsonObject->get("email").convert(email);
			
			paramJsonObject->get("email_verification_code_type").convert(email_verification_code_type_string);
			auto email_text = paramJsonObject->get("email_text");
			if (email_text.isString()) {
				email_text.convert(email_type_string);
			}
			else if (email_text.isInteger()) {
				email_text.convert(email_type_int);
			}
			
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	// convert types into enum
	if (email_type_int > 0 && email_type_int < model::EMAIL_MAX) {
		emailType = (model::EmailType)email_type_int;
	}
	else if (email_type_string != "") {
		emailType = model::Email::emailType(email_type_string);
	}
	emailVerificationCodeType = model::table::EmailOptIn::stringToType(email_verification_code_type_string);
	if (model::table::EMAIL_OPT_IN_EMPTY == emailVerificationCodeType) {
		return stateError("invalid verification code type");
	}

	switch (emailType) {
	case model::EMAIL_DEFAULT:
	case model::EMAIL_ERROR:
	case model::EMAIL_MAX: return stateError("invalid email type");
	}

	if (0 == session_id &&
		(model::table::EMAIL_OPT_IN_REGISTER == emailVerificationCodeType || model::table::EMAIL_OPT_IN_REGISTER_DIRECT == emailVerificationCodeType)
	   ){
		return stateError("login needed");
	}

	auto sm = SessionManager::getInstance();
	auto em = EmailManager::getInstance();
	auto lm = LanguageManager::getInstance();

	Session* session = nullptr;
	if (session_id != 0) {
		session = sm->getSession(session_id);
		if (nullptr == session) {
			return stateError("invalid session");
		}
	}

	auto receiver_user = controller::User::create();
	if (1 != receiver_user->load(email)) {
		return stateError("invalid email");
	}
	auto receiver_user_id = receiver_user->getModel()->getID();
	
	if (emailVerificationCodeType == model::table::EMAIL_OPT_IN_RESET_PASSWORD) 
	{
		session = sm->getNewSession();
		if (emailType == model::EMAIL_USER_RESET_PASSWORD) {
			auto r = session->sendResetPasswordEmail(receiver_user, false);
			if (1 == r) {
				return stateWarning("email already sended");
			}
			else if (2 == r) {
				return stateError("email already send less than a hour before");
			}
		}
		else if (emailType == model::EMAIL_CUSTOM_TEXT) {
			auto email_verification_code_object = controller::EmailVerificationCode::loadOrCreate(receiver_user_id, model::table::EMAIL_OPT_IN_RESET_PASSWORD);
			auto email = new model::Email(email_verification_code_object, receiver_user, emailCustomText, emailCustomSubject);
			em->addEmail(email);
		}
		else {
			return stateError("not supported email type");
		} 
		return stateSuccess();
	} 
	else 
	{
		if (session->getNewUser()->getModel()->getRole() != model::table::ROLE_ADMIN) {
			return stateError("admin needed");
		}
		
		auto email_verification_code_object = controller::EmailVerificationCode::loadOrCreate(receiver_user_id, emailVerificationCodeType);
		model::Email* email = nullptr;
		if (emailType == model::EMAIL_CUSTOM_TEXT) {
			email = new model::Email(email_verification_code_object, receiver_user, emailCustomText, emailCustomSubject);
		}
		else {
			email = new model::Email(email_verification_code_object, receiver_user, emailType);
		}
		em->addEmail(email);
		return stateSuccess();
	}

}