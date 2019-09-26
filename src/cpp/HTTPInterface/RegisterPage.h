#ifndef RegisterPage_INCLUDED
#define RegisterPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class RegisterPage: public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // RegisterPage_INCLUDED
