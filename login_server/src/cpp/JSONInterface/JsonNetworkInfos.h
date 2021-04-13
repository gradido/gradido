#ifndef __JSON_INTERFACE_JSON_NETWORK_INFOS_
#define __JSON_INTERFACE_JSON_NETWORK_INFOS_

#include "JsonRequestHandler.h"

class JsonNetworkInfos : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_INTERFACE_JSON_GET_USERS_