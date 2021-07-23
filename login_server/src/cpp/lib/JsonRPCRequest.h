/*!
 *
 * \author: Dario Rekowski
 *
 * \date: 13.01.2021
 *
 * \brief: Class for Json Requests to php server
 *
*/

#include "JsonRequest.h"

#ifndef __GRADIDO_LOGIN_SERVER_LIB_JSON_RPC_REQUEST_
#define __GRADIDO_LOGIN_SERVER_LIB_JSON_RPC_REQUEST_


class JsonRPCRequest : public JsonRequest
{
public:
	JsonRPCRequest(const std::string& serverHost, int serverPort);
	~JsonRPCRequest();

	rapidjson::Document request(const char* methodName, rapidjson::Value& params);

protected:

};


#endif //__GRADIDO_LOGIN_SERVER_LIB_JSON_RPC_REQUEST_