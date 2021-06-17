#ifndef __JSON_INTERFACE_JSON_RESET_PASSWORD_
#define __JSON_INTERFACE_JSON_RESET_PASSWORD_

#include "JsonRequestHandler.h"

/*!
* @author Dario Rekowski
* @date 2021-06-16
* @brief reset password, if user has forgetten his password
*
*/

class JsonResetPassword : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

};

#endif // __JSON_INTERFACE_JSON_RESET_PASSWORD_