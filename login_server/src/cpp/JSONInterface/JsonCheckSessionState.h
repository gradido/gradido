#ifndef __JSON_INTERFACE_JSON_CHECK_SESSION_STATE_
#define __JSON_INTERFACE_JSON_CHECK_SESSION_STATE_

#include "JsonRequestHandler.h"

class JsonCheckSessionState : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_INTERFACE_JSON_CHECK_SESSION_STATE_