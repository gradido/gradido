#ifndef __JSON_INTERFACE_JSON_CREATE_USER_
#define __JSON_INTERFACE_JSON_CREATE_USER_

#include "JsonRequestHandler.h"

class JsonCreateUser : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_CREATE_USER_