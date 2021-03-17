#ifndef __JSON_INTERFACE_JSON_ACQUIRE_ACCESS_TOKEN_
#define __JSON_INTERFACE_JSON_ACQUIRE_ACCESS_TOKEN_

#include "JsonRequestHandler.h"

class JsonAquireAccessToken : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_ACQUIRE_ACCESS_TOKEN_