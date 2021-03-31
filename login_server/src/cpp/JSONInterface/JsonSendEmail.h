#ifndef __JSON_SEND_EMAIL_H
#define __JSON_SEND_EMAIL_H

#include "JsonRequestHandler.h"

class JsonSendEmail : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_SEND_EMAIL_H