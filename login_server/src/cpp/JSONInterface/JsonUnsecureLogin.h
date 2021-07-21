#ifndef __JSON_INTERFACE_JSON_UNSECURE_LOGIN_
#define __JSON_INTERFACE_JSON_UNSECURE_LOGIN_

#include "JsonRequestHandler.h"

class JsonUnsecureLogin : public JsonRequestHandler
{
public:
	JsonUnsecureLogin(Poco::Net::IPAddress ip) : JsonRequestHandler(ip) {}

	rapidjson::Document handle(const rapidjson::Document& params);

protected:
	
};

#endif // __JSON_INTERFACE_JSON_UNSECURE_LOGIN_