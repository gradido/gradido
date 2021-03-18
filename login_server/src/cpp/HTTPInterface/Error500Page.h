#ifndef Error500Page_INCLUDED
#define Error500Page_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class Error500Page: public SessionHTTPRequestHandler
{
public:
	Error500Page(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // Error500Page_INCLUDED
