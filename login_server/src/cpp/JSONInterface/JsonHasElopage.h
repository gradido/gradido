#ifndef __JSON_INTERFACE_JSON_HAS_ELOPAGE_
#define __JSON_INTERFACE_JSON_HAS_ELOPAGE_

#include "JsonRequestHandler.h"

class JsonHasElopage : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:

};

#endif // __JSON_INTERFACE_JSON_HAS_ELOPAGE_