#ifndef DecodeTransactionPage_INCLUDED
#define DecodeTransactionPage_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "PageRequestMessagedHandler.h"


class DecodeTransactionPage: public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // DecodeTransactionPage_INCLUDED
