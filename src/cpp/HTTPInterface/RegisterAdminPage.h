#ifndef RegisterAdminPage_INCLUDED
#define RegisterAdminPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class RegisterAdminPage: public SessionHTTPRequestHandler
{
public:
	RegisterAdminPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // RegisterAdminPage_INCLUDED
