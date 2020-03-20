#ifndef __JSON_INTERFACE_JSON_GET_USER_INFOS_
#define __JSON_INTERFACE_JSON_GET_USER_INFOS_

#include "JsonRequestHandler.h"

class JsonGetUserInfos : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_GET_USER_INFOS_