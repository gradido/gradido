#ifndef __JSON_INTERFACE_JSON_UNSECURE_LOGIN_
#define __JSON_INTERFACE_JSON_UNSECURE_LOGIN_

#include "JsonRequestHandler.h"

class JsonUnsecureLogin : public JsonRequestHandler
{
public:
	JsonUnsecureLogin(Poco::Net::IPAddress ip) : mClientIP(ip) {}
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	Poco::Net::IPAddress mClientIP;


};

#endif // __JSON_INTERFACE_JSON_UNSECURE_LOGIN_