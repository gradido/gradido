#ifndef __JSON_INTERFACE_JSON_GET_USERS_
#define __JSON_INTERFACE_JSON_GET_USERS_

#include "JsonRequestHandler.h"

class JsonGetUsers : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_INTERFACE_JSON_GET_USERS_