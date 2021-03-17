#ifndef LoginPage_INCLUDED
#define LoginPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class LoginPage: public SessionHTTPRequestHandler
{
public:
	LoginPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // LoginPage_INCLUDED
