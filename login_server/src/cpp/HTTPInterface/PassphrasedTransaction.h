#ifndef PassphrasedTransaction_INCLUDED
#define PassphrasedTransaction_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "PageRequestMessagedHandler.h"


class PassphrasedTransaction: public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // PassphrasedTransaction_INCLUDED
