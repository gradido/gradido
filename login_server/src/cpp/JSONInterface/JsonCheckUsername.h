#ifndef __JSON_INTERFACE_JSON_CHECK_USERNAME_
#define __JSON_INTERFACE_JSON_CHECK_USERNAME_

#include "JsonRequestHandler.h"

class JsonCheckUsername : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_CHECK_USERNAME_