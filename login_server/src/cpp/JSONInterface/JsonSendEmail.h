#ifndef __JSON_SEND_EMAIL_H
#define __JSON_SEND_EMAIL_H

#include "JsonRequestHandler.h"

class JsonSendEmail : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_SEND_EMAIL_H