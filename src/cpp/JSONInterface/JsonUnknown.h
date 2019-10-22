#ifndef __JSON_INTERFACE_JSON_UNKNOWN_
#define __JSON_INTERFACE_JSON_UNKNOWN_

#include "JsonRequestHandler.h"

class JsonUnknown : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_UNKNOWN_