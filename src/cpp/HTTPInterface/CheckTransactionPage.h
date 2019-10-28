#ifndef CheckTransactionPage_INCLUDED
#define CheckTransactionPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class CheckTransactionPage: public SessionHTTPRequestHandler
{
public:
	CheckTransactionPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // CheckTransactionPage_INCLUDED
