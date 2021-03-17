#ifndef UpdateUserPasswordPage_INCLUDED
#define UpdateUserPasswordPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class UpdateUserPasswordPage: public SessionHTTPRequestHandler
{
public:
	UpdateUserPasswordPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // UpdateUserPasswordPage_INCLUDED
