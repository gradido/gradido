#ifndef DecodeTransactionPage_INCLUDED
#define DecodeTransactionPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class DecodeTransactionPage: public SessionHTTPRequestHandler
{
public:
	DecodeTransactionPage(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // DecodeTransactionPage_INCLUDED
