#ifndef DebugPassphrasePage_INCLUDED
#define DebugPassphrasePage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class DebugPassphrasePage: public SessionHTTPRequestHandler
{
public:
	DebugPassphrasePage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // DebugPassphrasePage_INCLUDED
