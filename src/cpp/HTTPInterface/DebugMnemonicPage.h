#ifndef DebugMnemonicPage_INCLUDED
#define DebugMnemonicPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class DebugMnemonicPage: public SessionHTTPRequestHandler
{
public:
	DebugMnemonicPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // DebugMnemonicPage_INCLUDED
