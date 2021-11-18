#ifndef __GRADIDO_LOGIN_SERVER_IOTA_REQUEST
#define __GRADIDO_LOGIN_SERVER_IOTA_REQUEST

#include "NotificationList.h"
#include "Poco/Net/HTTPClientSession.h"
#include "rapidjson/document.h"

class IotaRequest
{
public:
	IotaRequest(const std::string& serverHost, int serverPort, const std::string& urlPath);
	~IotaRequest();	

	
	//! \return messageId as hex string
	std::string sendMessage(const std::string& indexHex, const std::string& messageHex, NotificationList* errorReciver);

	Poco::SharedPtr<Poco::Net::HTTPClientSession> createClientSession(NotificationList* errorReciver);

protected:

	// Iota get parent message ids for own message
	std::vector<std::string> getTips(Poco::SharedPtr<Poco::Net::HTTPClientSession> clientSession, NotificationList* errorReciver);
	rapidjson::Document parseResponse(std::istream& responseStream, NotificationList* errorReciver);

	std::string mServerHost;
	int mServerPort;
	std::string mUrlPath;

};

#endif //__GRADIDO_LOGIN_SERVER_IOTA_REQUEST