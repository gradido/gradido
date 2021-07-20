#ifndef __JSON_INTERFACE_JSON_REQUEST_HANDLER_
#define __JSON_INTERFACE_JSON_REQUEST_HANDLER_

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/JSON/Object.h"
#include "Poco/JSON/Array.h"
#include "Poco/URI.h"
#include "../model/Session.h"
#include "../lib/NotificationList.h"

#include "rapidjson/document.h"


class JsonRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:

	JsonRequestHandler();
	JsonRequestHandler(Session* session);

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);

	virtual Poco::JSON::Object* handle(Poco::Dynamic::Var params) { return stateError("not longer implemented"); };
	virtual rapidjson::Document handle(const rapidjson::Document& params) { return rapidjson::Document(); };

	static Poco::Dynamic::Var parseJsonWithErrorPrintFile(std::istream& request_stream, rapidjson::Document& rapidParams, NotificationList* errorHandler = nullptr, const char* functionName = nullptr);
	static bool parseQueryParametersToRapidjson(const Poco::URI& uri, rapidjson::Document& rapidParams);

	inline void setSession(Session* session) { mSession = session; }

protected:
	Poco::JSON::Object* mResultJson;
	Poco::Net::IPAddress mClientIp;
	std::string			mServerHost;
	Session*			 mSession;

	Poco::JSON::Object* checkAndLoadSession(Poco::Dynamic::Var params, bool checkIp = false);
	rapidjson::Document rcheckAndLoadSession(const rapidjson::Document& params);
	bool getTargetGroup(const rapidjson::Document& params);

	rapidjson::Document getIntParameter(const rapidjson::Document& params, const char* fieldName, int& iParameter);
	rapidjson::Document getUIntParameter(const rapidjson::Document& params, const char* fieldName, unsigned int& iParameter);
	rapidjson::Document getBoolParameter(const rapidjson::Document& params, const char* fieldName, bool& bParameter);
	rapidjson::Document getUInt64Parameter(const rapidjson::Document& params, const char* fieldName, Poco::UInt64& iParameter);
	rapidjson::Document getStringParameter(const rapidjson::Document& params, const char* fieldName, std::string& strParameter);
	rapidjson::Document checkArrayParameter(const rapidjson::Document& params, const char* fieldName);

	static Poco::JSON::Object* stateError(const char* msg, std::string details = "");
	static rapidjson::Document rstateError(const char* msg, std::string details = "");
	static Poco::JSON::Object* stateError(const char* msg, NotificationList* errorReciver);
	static rapidjson::Document rstateError(const char* msg, NotificationList* errorReciver);
	static Poco::JSON::Object* stateError(const char* msg, const Poco::JSON::Array& details);
	static Poco::JSON::Object* customStateError(const char* state, const char* msg, std::string details = "");
	static rapidjson::Document rcustomStateError(const char* state, const char* msg, std::string details = "");
	static Poco::JSON::Object* stateSuccess();
	static rapidjson::Document rstateSuccess();
	static Poco::JSON::Object* stateWarning(const char* msg, std::string details = "");
	static rapidjson::Document rstateWarning(const char* msg, std::string details = "");

	Poco::AutoPtr<controller::Group> mTargetGroup;
};

#endif // __JSON_INTERFACE_JSON_REQUEST_HANDLER_