#ifndef __JSON_VERIFICATION_EMAIL_RESEND_H
#define __JSON_VERIFICATION_EMAIL_RESEND_H

#include "JsonRequestHandler.h"

class JsonAdminEmailVerificationResend : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:


};

#endif // __JSON_VERIFICATION_EMAIL_RESEND_H