#ifndef AdminHederaAccountPage_INCLUDED
#define AdminHederaAccountPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminHederaAccountPage: public SessionHTTPRequestHandler
{
public:
	AdminHederaAccountPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminHederaAccountPage_INCLUDED
