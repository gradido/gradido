#ifndef UserUpdatePasswordPage_INCLUDED
#define UserUpdatePasswordPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class UserUpdatePasswordPage: public SessionHTTPRequestHandler
{
public:
	UserUpdatePasswordPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // UserUpdatePasswordPage_INCLUDED
