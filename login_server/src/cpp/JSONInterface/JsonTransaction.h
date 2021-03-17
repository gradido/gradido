#ifndef __JSON_INTERFACE_JSON_TRANSACTION_
#define __JSON_INTERFACE_JSON_TRANSACTION_

#include "JsonRequestHandler.h"

class JsonTransaction : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_TRANSACTION_