#ifndef LoginPage_INCLUDED
#define LoginPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class LoginPage: public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // LoginPage_INCLUDED
