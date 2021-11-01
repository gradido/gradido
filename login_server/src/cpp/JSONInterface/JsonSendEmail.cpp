#include "JsonSendEmail.h"

#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"
#include "../SingletonManager/LanguageManager.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../lib/DataTypeConverter.h"


using namespace rapidjson;

Document JsonSendEmail::handle(const Document& params)
{
	checkAndLoadSession(params);
	
	std::string email;
	auto paramError = getStringParameter(params, "email", email);
	if (paramError.IsObject()) return paramError;

	model::EmailType emailType = model::EMAIL_DEFAULT;
	std::string semailType;
	int iemailType = 0;
	paramError = getStringIntParameter(params, "email_text", semailType, iemailType);
	if (paramError.IsObject()) return paramError;

	if (iemailType > 0 && iemailType < model::EMAIL_MAX) {
		emailType = (model::EmailType)iemailType;
	}
	else if (semailType != "") {
		emailType = model::Email::emailType(semailType);
	}
	if (emailType == model::EMAIL_MAX) {
		return stateError("invalid email type");
	}

	std::string emailCustomText;
	std::string emailCustomSubject;
	if (emailType == model::EMAIL_CUSTOM_TEXT) {
		paramError = getStringParameter(params, "email_custom_text", emailCustomText);
		if (paramError.IsObject()) return paramError;

		paramError = getStringParameter(params, "email_custom_subject", emailCustomSubject);
		if (paramError.IsObject()) return paramError;
	}

	model::table::EmailOptInType emailVerificationCodeType;
	std::string emailVerificationCodeTypeString;
	paramError = getStringParameter(params, "email_verification_code_type", emailVerificationCodeTypeString);
	if (paramError.IsObject()) return paramError;

	emailVerificationCodeType = model::table::EmailOptIn::stringToType(emailVerificationCodeTypeString);
	if (model::table::EMAIL_OPT_IN_EMPTY == emailVerificationCodeType) {
		return stateError("invalid verification code type");
	}

	if (!mSession &&
		(model::table::EMAIL_OPT_IN_REGISTER == emailVerificationCodeType || model::table::EMAIL_OPT_IN_REGISTER_DIRECT == emailVerificationCodeType)
		) {
		return stateError("login needed");
	}

	auto sm = SessionManager::getInstance();
	auto em = EmailManager::getInstance();
	auto lm = LanguageManager::getInstance();

	Poco::Thread::sleep(ServerConfig::g_FakeLoginSleepTime);
	auto receiver_user = controller::User::create();
	if (1 != receiver_user->load(email)) {
		return stateSuccess();
	}
	auto receiver_user_id = receiver_user->getModel()->getID();
	std::string linkInEmail = "";
	if (emailVerificationCodeType == model::table::EMAIL_OPT_IN_RESET_PASSWORD)
	{
		linkInEmail = receiver_user->getGroupBaseUrl() + ServerConfig::g_frontend_resetPasswordPath;
		mSession = sm->getNewSession();
		if (emailType == model::EMAIL_USER_RESET_PASSWORD) {
			auto r = mSession->sendResetPasswordEmail(receiver_user, true, linkInEmail);
			if (1 == r) {
				return stateWarning("email already sended");
			}
			else if (2 == r) {
				return stateError("email already sent less than a 10 minutes before");
			}
		}
		else if (emailType == model::EMAIL_CUSTOM_TEXT) {
			auto email_verification_code_object = controller::EmailVerificationCode::loadOrCreate(receiver_user_id, model::table::EMAIL_OPT_IN_RESET_PASSWORD);
			email_verification_code_object->setBaseUrl(linkInEmail);
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
		linkInEmail = receiver_user->getGroupBaseUrl() + ServerConfig::g_frontend_checkEmailPath;
		if (mSession->getNewUser()->getModel()->getRole() != model::table::ROLE_ADMIN) {
			return stateError("admin needed");
		}

		auto email_verification_code_object = controller::EmailVerificationCode::loadOrCreate(receiver_user_id, emailVerificationCodeType);
		email_verification_code_object->setBaseUrl(linkInEmail);
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
