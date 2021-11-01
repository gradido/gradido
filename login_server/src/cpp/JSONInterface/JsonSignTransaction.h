#ifndef __JSON_INTERFACE_JSON_SIGN_TRANSACTION_
#define __JSON_INTERFACE_JSON_SIGN_TRANSACTION_

#include "JsonRequestHandler.h"

class JsonSignTransaction : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);
};

#endif // __JSON_INTERFACE_JSON_SIGN_TRANSACTION_