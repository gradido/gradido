#ifndef __JSON_INTERFACE_JSON_SIGN_TRANSACTION_
#define __JSON_INTERFACE_JSON_SIGN_TRANSACTION_

#include "JsonRequestHandler.h"

class JsonSignTransaction : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:

};

#endif // __JSON_INTERFACE_JSON_SIGN_TRANSACTION_