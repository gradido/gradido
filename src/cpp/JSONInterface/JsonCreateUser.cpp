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
	int emailType;
	auto em = EmailManager::getInstance();
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
			paramJsonObject->get("first_name").convert(first_name);
			paramJsonObject->get("last_name").convert(last_name);
			paramJsonObject->get("emailType").convert(emailType);
			if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_PASSWORD_REQUESTS)) {
				paramJsonObject->get("password").convert(password);
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
		return customStateError("exist", "user already exist");
	}

	if (password.size()) {
		ErrorList errors;
		if (!sm->checkPwdValidation(password, &errors)) {
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
	user = controller::User::create(email, first_name, last_name);
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

	em->addEmail(new model::Email(emailOptIn, user, model::Email::convertTypeFromInt(emailType)));

	return stateSuccess();
	
}