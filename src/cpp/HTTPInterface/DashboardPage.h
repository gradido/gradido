#ifndef DashboardPage_INCLUDED
#define DashboardPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class DashboardPage: public SessionHTTPRequestHandler
{
public:
	DashboardPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // DashboardPage_INCLUDED
