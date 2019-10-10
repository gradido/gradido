#ifndef Elopage_Webhook_INCLUDED
#define Elopage_Webhook_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"
#include "../tasks/CPUTask.h"


class ElopageWebhook : public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};

class HandleElopageRequestTask : public UniLib::controller::CPUTask
{
public:
	HandleElopageRequestTask(Poco::Net::NameValueCollection& requestData)
		: CPUTask(ServerConfig::g_CPUScheduler), mRequestData(requestData) {}

	const char* getResourceType() const { return "HandleElopageRequestTask"; };
	int run();

protected:
	Poco::Net::NameValueCollection mRequestData;
};


#endif // Elopage_Webhook_INCLUDED
