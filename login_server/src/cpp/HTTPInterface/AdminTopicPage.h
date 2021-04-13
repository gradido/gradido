#ifndef AdminTopicPage_INCLUDED
#define AdminTopicPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminTopicPage: public SessionHTTPRequestHandler
{
public:
	AdminTopicPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminTopicPage_INCLUDED
