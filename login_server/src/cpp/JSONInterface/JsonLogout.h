#ifndef __JSON_INTERFACE_JSON_LOGOUT_
#define __JSON_INTERFACE_JSON_LOGOUT_

#include "JsonRequestHandler.h"

class JsonLogout : public JsonRequestHandler
{
public:
	JsonLogout(Poco::Net::IPAddress ip) : JsonRequestHandler(ip) {}
	rapidjson::Document handle(const rapidjson::Document& params);

protected:

};

#endif // __JSON_INTERFACE_JSON_LOGOUT_