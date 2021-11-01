#ifndef __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_
#define __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_

#include "JsonRequestHandler.h"

class JsonLoginViaEmailVerificationCode : public JsonRequestHandler
{
public:
	JsonLoginViaEmailVerificationCode(Poco::Net::IPAddress ip) : JsonRequestHandler(ip) {}
	rapidjson::Document handle(const rapidjson::Document& params);

protected:
	
};

#endif // __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_