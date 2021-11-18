#ifndef __JSON_INTERFACE_JSON_HAS_ELOPAGE_
#define __JSON_INTERFACE_JSON_HAS_ELOPAGE_

#include "JsonRequestHandler.h"

class JsonHasElopage : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:

};

#endif // __JSON_INTERFACE_JSON_HAS_ELOPAGE_