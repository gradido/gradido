#ifndef AdminNodeServerTestPage_INCLUDED
#define AdminNodeServerTestPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "PageRequestMessagedHandler.h"


class AdminNodeServerTestPage: public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminNodeServerTestPage_INCLUDED
