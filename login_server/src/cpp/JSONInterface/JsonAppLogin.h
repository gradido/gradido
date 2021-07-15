#ifndef __JSON_INTERFACE_JSON_APP_LOGIN_H_
#define __JSON_INTERFACE_JSON_APP_LOGIN_H_

#include "JsonRequestHandler.h"

class JsonAppLogin : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_INTERFACE_JSON_APP_LOGIN_H_