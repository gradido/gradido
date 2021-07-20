#ifndef __JSON_INTERFACE_JSON_CREATE_USER_
#define __JSON_INTERFACE_JSON_CREATE_USER_

#include "JsonRequestHandler.h"

class JsonCreateUser : public JsonRequestHandler
{
public:
	JsonCreateUser(Poco::Net::IPAddress ip) : mClientIP(ip) {}
	rapidjson::Document handle(const rapidjson::Document& params);

protected:
	Poco::Net::IPAddress mClientIP;


};

#endif // __JSON_INTERFACE_JSON_CREATE_USER_