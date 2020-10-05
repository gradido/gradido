#ifndef UserUpdateGroupPage_INCLUDED
#define UserUpdateGroupPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class UserUpdateGroupPage: public SessionHTTPRequestHandler
{
public:
	UserUpdateGroupPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // UserUpdateGroupPage_INCLUDED
