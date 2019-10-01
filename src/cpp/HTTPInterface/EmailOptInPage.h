#ifndef EmailOptInPage_INCLUDED
#define EmailOptInPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class EmailOptInPage: public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // EmailOptInPage_INCLUDED
