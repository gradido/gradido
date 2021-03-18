#ifndef CheckEmailPage_INCLUDED
#define CheckEmailPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class CheckEmailPage: public SessionHTTPRequestHandler
{
public:
	CheckEmailPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // CheckEmailPage_INCLUDED
