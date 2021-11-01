#ifndef __JSON_INTERFACE_JSON_UPDATE_USER_INFOS_
#define __JSON_INTERFACE_JSON_UPDATE_USER_INFOS_

#include "JsonRequestHandler.h"

/*!
* @author Dario Rekowski
* @date 2020-07-30
* @brief to update non critical user data like first-name and last-name from community server with valid login-server session id
*
* works only for admins
*/

class JsonUpdateUserInfos : public JsonRequestHandler
{
public:
	JsonUpdateUserInfos(Session* session) : JsonRequestHandler(session) {};

	rapidjson::Document handle(const rapidjson::Document& params);

protected:	
	bool isOldPasswordValid(const rapidjson::Value& updates, rapidjson::Value& errors, rapidjson::Document::AllocatorType& alloc);


};

#endif // __JSON_INTERFACE_JSON_UPDATE_USER_INFOS_