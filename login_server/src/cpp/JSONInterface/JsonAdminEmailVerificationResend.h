#ifndef __JSON_VERIFICATION_EMAIL_RESEND_H
#define __JSON_VERIFICATION_EMAIL_RESEND_H

#include "JsonRequestHandler.h"

class JsonAdminEmailVerificationResend : public JsonRequestHandler
{
public:
	rapidjson::Document handle(const rapidjson::Document& params);

protected:


};

#endif // __JSON_VERIFICATION_EMAIL_RESEND_H