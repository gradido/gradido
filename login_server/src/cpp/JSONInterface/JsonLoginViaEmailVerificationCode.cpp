#include "JsonLoginViaEmailVerificationCode.h"

#include "JsonUnsecureLogin.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "Poco/URI.h"
#include "Poco/JSON/Array.h"

Poco::JSON::Object* JsonLoginViaEmailVerificationCode::handle(Poco::Dynamic::Var params)
{

	auto sm = SessionManager::getInstance();
	
	/*
		email verification code
	*/
	// incoming
	unsigned long long code = 0;
	if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		std::string codeString;
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "emailVerificationCode") {
				codeString = it->second;
				break;
			}
		}
		if (codeString == "") {
			return stateError("emailVerificationCode not found");
		}
		if (DataTypeConverter::NUMBER_PARSE_OKAY != DataTypeConverter::strToInt(codeString, code)) {
			return stateError("couldn't parse emailVerificationCode");
		}

	}
	auto session = sm->findByEmailVerificationCode(code);
	if (!session) {
		session = sm->getNewSession();
		if (!session->loadFromEmailVerificationCode(code)) {
			return stateError("couldn't login with emailVerificationCode");
		}
	}
	session->setClientIp(mClientIP);
	auto result = new Poco::JSON::Object;
	result->set("state", "success");
	result->set("session_id", session->getHandle());
	result->set("email_verification_code_type", model::table::EmailOptIn::typeToString(session->getEmailVerificationType()));
	Poco::JSON::Array info;
	auto user = session->getNewUser();

	if (!user->getModel()->getPasswordHashed()) {
		info.add("user hasn't password");
	}
	auto update_email_verification_result = session->updateEmailVerification(code);
	if (1 == update_email_verification_result) {
		info.add("email already activated");
	}
	result->set("user", user->getJson());

	result->set("info", info);


	return result;

}