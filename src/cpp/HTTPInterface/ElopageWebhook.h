#ifndef Elopage_Webhook_INCLUDED
#define Elopage_Webhook_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class ElopageWebhook : public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // Elopage_Webhook_INCLUDED
