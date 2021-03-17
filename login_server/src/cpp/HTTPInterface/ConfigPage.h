#ifndef ConfigPage_INCLUDED
#define ConfigPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class ConfigPage: public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // ConfigPage_INCLUDED
