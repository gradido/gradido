#ifndef PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
#define PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED

//#include "../model/Session.h"
#include "../model/ErrorList.h"
#include "../model/Profiler.h"
#include "Poco/Net/HTTPRequestHandler.h"



class PageRequestMessagedHandler : public Poco::Net::HTTPRequestHandler, public ErrorList
{
public:
	PageRequestMessagedHandler() {}

	inline void setProfiler(Profiler profiler) { mTimeProfiler = profiler; }
	//Poco::Net::HTTPRequestHandler* createRequestHandler(const Poco::Net::HTTPServerRequest& request);

protected:
	Profiler mTimeProfiler;
};


#endif // PAGE_REQUEST_MESSAGE_HANDLER_INCLUDED
