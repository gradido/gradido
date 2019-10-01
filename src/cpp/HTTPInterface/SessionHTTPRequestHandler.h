#ifndef SESSION_HTTP_REQUEST_HANDLER_INCLUDED
#define SESSION_HTTP_REQUEST_HANDLER_INCLUDED

#include "../model/Session.h"
#include "Poco/Net/HTTPRequestHandler.h"


class SessionHTTPRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:
	SessionHTTPRequestHandler(Session* session) : mSession(session) {}

protected:
	Session* mSession;
};


#endif // SESSION_HTTP_REQUEST_HANDLER_INCLUDED
