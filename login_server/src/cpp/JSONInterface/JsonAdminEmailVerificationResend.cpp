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
	
	auto session_result = rcheckAndLoadSession(params);
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
		return rstateError("session not found");
	}

	auto user = mSession->getNewUser();
	if(user.isNull()) { 
		return rstateError("session hasn't valid user");
	}
		
	auto userModel = user->getModel();
	if(model::table::ROLE_ADMIN != userModel->getRole()) {
		return rstateError("user isn't admin"); 
	}

	auto receiverUser = controller::User::create();
	if (1 != receiverUser->load(email)) {
		return rstateError("receiver user not found"); 
	}
		
	if (receiverUser->getModel()->isEmailChecked()) { 
		return rstateError("account already active");
	}
		
	auto emailVerification = controller::EmailVerificationCode::create(receiverUser->getModel()->getID(), model::table::EMAIL_OPT_IN_REGISTER);
	if (emailVerification.isNull()) {
		return rstateError("no email verification code found");
	}

	emailVerification->getModel()->insertIntoDB(false);
	emailVerification->setBaseUrl(ServerConfig::g_serverPath + "/checkEmail");
	em->addEmail(new model::Email(emailVerification, receiverUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND));
	return rstateSuccess();
}