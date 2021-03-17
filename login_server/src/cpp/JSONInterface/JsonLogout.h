#ifndef __JSON_INTERFACE_JSON_LOGOUT_
#define __JSON_INTERFACE_JSON_LOGOUT_

#include "JsonRequestHandler.h"

class JsonLogout : public JsonRequestHandler
{
public:
	JsonLogout(Poco::Net::IPAddress ip) : mClientIP(ip) {}
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	Poco::Net::IPAddress mClientIP;


};

#endif // __JSON_INTERFACE_JSON_LOGOUT_