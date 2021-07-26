#ifndef __JSON_INTERFACE_JSON_REQUEST_HANDLER_
#define __JSON_INTERFACE_JSON_REQUEST_HANDLER_

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/URI.h"
#include "../model/Session.h"
#include "../lib/NotificationList.h"

#include "rapidjson/document.h"


class JsonRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:

	JsonRequestHandler();
	JsonRequestHandler(Poco::Net::IPAddress clientIp);
	JsonRequestHandler(Session* session, Poco::Net::IPAddress clientIp);
	JsonRequestHandler(Session* session);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);

	virtual rapidjson::Document handle(const rapidjson::Document& params) { return rapidjson::Document(); };

	void parseJsonWithErrorPrintFile(std::istream& request_stream, rapidjson::Document& rapidParams, NotificationList* errorHandler = nullptr, const char* functionName = nullptr);
	static bool parseQueryParametersToRapidjson(const Poco::URI& uri, rapidjson::Document& rapidParams);

	inline void setSession(Session* session) { mSession = session; }

	static rapidjson::Document getIntParameter(const rapidjson::Document& params, const char* fieldName, int& iParameter);
	static rapidjson::Document getUIntParameter(const rapidjson::Document& params, const char* fieldName, unsigned int& iParameter);
	static rapidjson::Document getBoolParameter(const rapidjson::Document& params, const char* fieldName, bool& bParameter);
	static rapidjson::Document getUInt64Parameter(const rapidjson::Document& params, const char* fieldName, Poco::UInt64& iParameter);
	static rapidjson::Document getStringParameter(const rapidjson::Document& params, const char* fieldName, std::string& strParameter);
	static rapidjson::Document getStringIntParameter(const rapidjson::Document& params, const char* fieldName, std::string& strParameter, int& iParameter);
	static rapidjson::Document checkArrayParameter(const rapidjson::Document& params, const char* fieldName);
	static rapidjson::Document checkObjectParameter(const rapidjson::Document& params, const char* fieldName);


	static rapidjson::Document rstateError(const char* msg, std::string details = "");
	static rapidjson::Document rstateError(const char* msg, NotificationList* errorReciver);
	static rapidjson::Document rcustomStateError(const char* state, const char* msg, std::string details = "");
	static rapidjson::Document rstateSuccess();
	static rapidjson::Document rstateWarning(const char* msg, std::string details = "");

protected:
	Poco::Net::IPAddress mClientIp;
	std::string			mServerHost;
	Session*			 mSession;

	rapidjson::Document rcheckAndLoadSession(const rapidjson::Document& params);
	bool getTargetGroup(const rapidjson::Document& params);

	

	Poco::AutoPtr<controller::Group> mTargetGroup;
};

#endif // __JSON_INTERFACE_JSON_REQUEST_HANDLER_