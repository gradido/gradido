#ifndef AdminNodeServerPage_INCLUDED
#define AdminNodeServerPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminNodeServerPage: public SessionHTTPRequestHandler
{
public:
	AdminNodeServerPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminNodeServerPage_INCLUDED
