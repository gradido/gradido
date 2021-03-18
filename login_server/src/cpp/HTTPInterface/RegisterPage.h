#ifndef RegisterPage_INCLUDED
#define RegisterPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "PageRequestMessagedHandler.h"


class RegisterPage: public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // RegisterPage_INCLUDED
