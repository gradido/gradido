#ifndef RegisterDirectPage_INCLUDED
#define RegisterDirectPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "PageRequestMessagedHandler.h"


class RegisterDirectPage: public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // RegisterDirectPage_INCLUDED
