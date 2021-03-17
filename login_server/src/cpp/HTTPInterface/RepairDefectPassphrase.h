#ifndef RepairDefectPassphrase_INCLUDED
#define RepairDefectPassphrase_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class RepairDefectPassphrase: public SessionHTTPRequestHandler
{
public:
	RepairDefectPassphrase(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // RepairDefectPassphrase_INCLUDED
