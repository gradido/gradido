#ifndef HandleFileRequest_INCLUDED
#define HandleFileRequest_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


class HandleFileRequest : public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // HandleFileRequest_INCLUDED
