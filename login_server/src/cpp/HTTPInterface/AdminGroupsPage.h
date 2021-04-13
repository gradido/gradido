#ifndef AdminGroupsPage_INCLUDED
#define AdminGroupsPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminGroupsPage: public SessionHTTPRequestHandler
{
public:
	AdminGroupsPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminGroupsPage_INCLUDED
