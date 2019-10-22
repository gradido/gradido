#ifndef __JSON_INTERFACE_JSON_GET_LOGIN_
#define __JSON_INTERFACE_JSON_GET_LOGIN_

#include "JsonRequestHandler.h"

class JsonGetLogin : public JsonRequestHandler
{
public:
	Poco::JSON::Object handle(Poco::Dynamic::Var params);

protected:
	

};

#endif // __JSON_INTERFACE_JSON_GET_LOGIN_