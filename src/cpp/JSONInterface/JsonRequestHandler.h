#ifndef __JSON_INTERFACE_JSON_REQUEST_HANDLER_
#define __JSON_INTERFACE_JSON_REQUEST_HANDLER_

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/JSON/Object.h"

class JsonRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);

	virtual Poco::JSON::Object handle(Poco::Dynamic::Var params) = 0;

protected:


};

#endif // __JSON_INTERFACE_JSON_REQUEST_HANDLER_