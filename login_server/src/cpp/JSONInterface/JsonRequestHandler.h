#ifndef __JSON_INTERFACE_JSON_REQUEST_HANDLER_
#define __JSON_INTERFACE_JSON_REQUEST_HANDLER_

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/JSON/Object.h"
#include "Poco/JSON/Array.h"
#include "../model/Session.h"
#include "../lib/NotificationList.h"


class JsonRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:

	JsonRequestHandler();
	JsonRequestHandler(Session* session);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);

	virtual Poco::JSON::Object* handle(Poco::Dynamic::Var params) = 0;

	static Poco::Dynamic::Var parseJsonWithErrorPrintFile(std::istream& request_stream, NotificationList* errorHandler = nullptr, const char* functionName = nullptr);

	inline void setSession(Session* session) { mSession = session; }

protected:
	Poco::JSON::Object* mResultJson;
	Poco::Net::IPAddress mClientIp;
	std::string			mServerHost;
	Session*			 mSession;

	Poco::JSON::Object* checkAndLoadSession(Poco::Dynamic::Var params, bool checkIp = false);

	static Poco::JSON::Object* stateError(const char* msg, std::string details = "");
	static Poco::JSON::Object* stateError(const char* msg, NotificationList* errorReciver);
	static Poco::JSON::Object* stateError(const char* msg, const Poco::JSON::Array& details);
	static Poco::JSON::Object* customStateError(const char* state, const char* msg, std::string details = "");
	static Poco::JSON::Object* stateSuccess();
	static Poco::JSON::Object* stateWarning(const char* msg, std::string details = "");


};

#endif // __JSON_INTERFACE_JSON_REQUEST_HANDLER_