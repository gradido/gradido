#ifndef __DR_PAGE_REQUEST_HANDLER_FACTORY_H
#define __DR_PAGE_REQUEST_HANDLER_FACTORY_H

#include "Poco/Net/HTTPRequestHandlerFactory.h"
#include "Poco/RegularExpression.h"
#include "Poco/Logger.h"
#include "../model/Session.h"
#include "../lib/Profiler.h"
#include "PageRequestMessagedHandler.h"

#define HTTP_PAGES_COUNT 1

class PageRequestHandlerFactory : public Poco::Net::HTTPRequestHandlerFactory
{
public:
	PageRequestHandlerFactory();
	Poco::Net::HTTPRequestHandler* createRequestHandler(const Poco::Net::HTTPServerRequest& request);

protected:
	Poco::Net::HTTPRequestHandler* handleCheckEmail(Session* session, const std::string uri, const Poco::Net::HTTPServerRequest& request, Profiler timeUsed);

	Poco::Net::HTTPRequestHandler* basicSetup(PageRequestMessagedHandler* handler, const Poco::Net::HTTPServerRequest& request, Profiler profiler);

	Poco::RegularExpression mRemoveGETParameters;
	Poco::Logger& mLogging;
};

#endif // __DR_PAGE_REQUEST_HANDLER_FACTORY_H