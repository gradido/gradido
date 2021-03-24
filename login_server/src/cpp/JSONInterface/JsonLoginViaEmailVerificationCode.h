#ifndef __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_
#define __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_

#include "JsonRequestHandler.h"

class JsonLoginViaEmailVerificationCode : public JsonRequestHandler
{
public:
	JsonLoginViaEmailVerificationCode(Poco::Net::IPAddress ip) : mClientIP(ip) {}
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	Poco::Net::IPAddress mClientIP;


};

#endif // __JSON_INTERFACE_JSON_LOGIN_VIA_EMAIL_VERIFICATION_CODE_