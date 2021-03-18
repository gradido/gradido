#ifndef PassphrasePage_INCLUDED
#define PassphrasePage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class PassphrasePage: public SessionHTTPRequestHandler
{
public:
	PassphrasePage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // PassphrasePage_INCLUDED
