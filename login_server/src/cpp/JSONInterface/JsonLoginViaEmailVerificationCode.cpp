#include "JsonLoginViaEmailVerificationCode.h"

#include "JsonUnsecureLogin.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "Poco/URI.h"
#include "Poco/JSON/Array.h"

using namespace rapidjson;

Document JsonLoginViaEmailVerificationCode::handle(const Document& params)
{
	auto sm = SessionManager::getInstance();
	Poco::UInt64 code = 0;
	auto paramError = getUInt64Parameter(params, "emailVerificationCode", code);
	if (paramError.IsObject()) return paramError;

	auto session = sm->findByEmailVerificationCode(code);
	if (!session) {
		session = sm->getNewSession();
		if (!session->loadFromEmailVerificationCode(code)) {
			return rstateError("couldn't login with emailVerificationCode");
		}
	}
	session->setClientIp(mClientIp);
	Document result(kObjectType); 
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);
	result.AddMember("session_id", session->getHandle(), alloc);
	auto email_verification_type_string = model::table::EmailOptIn::typeToString(session->getEmailVerificationType());
	result.AddMember("email_verification_code_type", Value(email_verification_type_string, alloc), alloc);

	Value info(kArrayType);
	
	auto user = session->getNewUser();

	if (!user->getModel()->getPasswordHashed()) {
		info.PushBack("user has no password", alloc);
	}
	auto update_email_verification_result = session->updateEmailVerification(code);
	if (1 == update_email_verification_result) {
		info.PushBack("email already activated", alloc);
	}
	result.AddMember("user", user->getJson(alloc), alloc);

	result.AddMember("info", info, alloc);


	return result;

}
