#include "JsonAdminEmailVerificationResend.h"

#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"

#include "../controller/User.h"
#include "../controller/EmailVerificationCode.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonAdminEmailVerificationResend::handle(Poco::Dynamic::Var params)
{
	std::string email;
	int session_id = 0;
	bool parameterReaded = false;
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
			parameterReaded = true;
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else if (params.isStruct()) {
		auto _email = params["email"];
		auto _session_id = params["session_id"];
		parameterReaded = true;
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "email") {
				email = it->second;
				break;
			}
			else if (it->first == "session_id") {
				try {
					auto numberParseResult = DataTypeConverter::strToInt(it->second, session_id);
					if (DataTypeConverter::NUMBER_PARSE_OKAY != numberParseResult) {
						return stateError("error parsing session_id", DataTypeConverter::numberParseStateToString(numberParseResult));
					}
				}
				catch (Poco::Exception& ex) {
					//printf("[JsonGetLogin::handle] exception: %s\n", ex.displayText().data());
					return stateError("error parsing query params, Poco Error", ex.displayText());
				}
			}
		}
		parameterReaded = true;
	}

	if (!parameterReaded) {
		return stateError("error reading parameter");
	}
	if ("" == email || 0 == session_id) {
		return stateError("missing parameter");
	}
	
	
	auto sm = SessionManager::getInstance();
	auto em = EmailManager::getInstance();

	auto session = sm->getSession(session_id);
	if (!session) { 
		return stateError("session not found");
	}

	auto user = session->getNewUser();
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
	em->addEmail(new model::Email(emailVerification, receiverUser, model::EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND));
	return stateSuccess();

}