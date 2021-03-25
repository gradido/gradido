#ifndef __JSON_INTERFACE_JSON_GET_USER_INFOS_
#define __JSON_INTERFACE_JSON_GET_USER_INFOS_

#include "JsonRequestHandler.h"
#include "../model/table/EmailOptIn.h"
/*!
 * @author Dario Rekowski
 * @date 2020-03-21
 * @brief call to get more infos about user
 *
 * works only for admins
 */

class JsonGetUserInfos : public JsonRequestHandler
{
public:
	Poco::JSON::Object* handle(Poco::Dynamic::Var params);

protected:
	Poco::UInt64 readOrCreateEmailVerificationCode(int user_id, model::table::EmailOptInType type);

};

#endif // __JSON_INTERFACE_JSON_GET_USER_INFOS_