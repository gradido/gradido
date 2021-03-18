#ifndef AdminUserPasswordReset_INCLUDED
#define AdminUserPasswordReset_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminUserPasswordReset: public SessionHTTPRequestHandler
{
public:
	AdminUserPasswordReset(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminUserPasswordReset_INCLUDED
