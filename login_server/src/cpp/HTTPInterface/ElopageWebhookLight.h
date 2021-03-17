#ifndef Elopage_Webhook_LIGHT_INCLUDED
#define Elopage_Webhook_LIGHT_INCLUDED


#include "PageRequestMessagedHandler.h"


class ElopageWebhookLight : public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};



#endif // Elopage_Webhook_LIGHT_INCLUDED
