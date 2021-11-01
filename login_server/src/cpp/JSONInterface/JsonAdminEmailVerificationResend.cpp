#include "JsonAdminEmailVerificationResend.h"


#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../lib/DataTypeConverter.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonAdminEmailVerificationResend::handle(const Document& params)
{
	std::string email;
	
	auto session_result = checkAndLoadSession(params);
	if (session_result.IsObject()) {
		return session_result;
	}
	
	auto email_result = getStringParameter(params, "email", email);
	if (email_result.IsObject()) {
		return email_result;
	}
	
	
	auto sm = SessionManager::getInstance();
	auto em = EmailManager::getInstance();

	if (!mSession) { 
		return stateError("session not found");
	}

	auto user = mSession->getNewUser();
	if(user.isNull()) { 
		return stateError("session hasn't valid user");
	}
		
	auto userModel = user->getModel();
	if(model::table::ROLE_ADMIN != userModel->getRole()) {
		return stateError("user isn't admin"); 
	}

	auto receiverUser = controller::User::create();
	if (1 != receiverUser->load(email)) {
		return stateError("receiver user not found"); 
	}
		
	if (receiverUser->getModel()->isEmailChecked()) { 
		return stateError("account already active");
	}
		
	auto emailVerification = controller::EmailVerificationCode::create(receiverUser->getModel()->getID(), model::table::EMAIL_OPT_IN_REGISTER);
	if (emailVerification.isNull()) {
		return stateError("no email verification code found");
	}

	emailVerification->getModel()->insertIntoDB(false);
	emailVerification->setBaseUrl(ServerConfig::g_serverPath + "/checkEmail");
	em->addEmail(new model::Email(emailVerification, receiverUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND));
	return stateSuccess();
}