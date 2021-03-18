#ifndef AdminCheckUserBackup_INCLUDED
#define AdminCheckUserBackup_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class AdminCheckUserBackup: public SessionHTTPRequestHandler
{
public:
	AdminCheckUserBackup(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // AdminCheckUserBackup_INCLUDED
