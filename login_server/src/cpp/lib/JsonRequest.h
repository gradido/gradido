/*!
 *
 * \author: Dario Rekowski
 * 
 * \date: 13.12.2019
 * 
 * \brief: Class for Json Requests to php server
 *
*/

#include "NotificationList.h"
#include "Poco/Net/NameValueCollection.h"
#include "Poco/JSON/Object.h"

#ifndef __GRADIDO_LOGIN_SERVER_LIB_JSON_REQUEST_
#define __GRADIDO_LOGIN_SERVER_LIB_JSON_REQUEST_

enum JsonRequestReturn 
{
	JSON_REQUEST_RETURN_OK,
	JSON_REQUEST_RETURN_PARSE_ERROR,
	JSON_REQUEST_RETURN_ERROR,
	JSON_REQUEST_CONNECT_ERROR
};

class JsonRequest : public NotificationList
{
public:
	JsonRequest(const std::string& serverHost, int serverPort);
	~JsonRequest();

	JsonRequestReturn request(const char* methodName, const Poco::Net::NameValueCollection& payload);
	JsonRequestReturn request(const char* methodName, const Poco::JSON::Object& payload);
	JsonRequestReturn request(const char* methodName);
	JsonRequestReturn requestGRPCRelay(const Poco::Net::NameValueCollection& payload);

protected:
	int mServerPort;
	std::string mServerHost;
	
};


#endif //__GRADIDO_LOGIN_SERVER_LIB_JSON_REQUEST_