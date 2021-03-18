#ifndef TranslatePassphrase_INCLUDED
#define TranslatePassphrase_INCLUDED


#include "Poco/Net/HTTPRequestHandler.h"


#include "SessionHTTPRequestHandler.h"


class TranslatePassphrase: public SessionHTTPRequestHandler
{
public:
	TranslatePassphrase(Session*);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};


#endif // TranslatePassphrase_INCLUDED
