#ifndef __DR_JSON_REQUEST_HANDLER_FACTORY_H
#define __DR_JSON_REQUEST_HANDLER_FACTORY_H

#include "Poco/Net/HTTPRequestHandlerFactory.h"
#include "Poco/RegularExpression.h"

#include "Poco/Logger.h"

#define HTTP_PAGES_COUNT 1

class JsonRequestHandlerFactory : public Poco::Net::HTTPRequestHandlerFactory
{
public:
	JsonRequestHandlerFactory();
	Poco::Net::HTTPRequestHandler* createRequestHandler(const Poco::Net::HTTPServerRequest& request);

protected:
	Poco::RegularExpression mRemoveGETParameters;
	Poco::Logger& mLogging;
};

#endif // __DR_JSON_REQUEST_HANDLER_FACTORY_H