#ifndef SaveKeysPage_INCLUDED
#define SaveKeysPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class SaveKeysPage: public SessionHTTPRequestHandler
{
public:
	SaveKeysPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // SaveKeysPage_INCLUDED
