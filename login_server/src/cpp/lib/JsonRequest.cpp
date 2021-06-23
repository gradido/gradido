
#include "JsonRequest.h"
#include "Profiler.h"


#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"
#include "Poco/JSON/Parser.h"

#include "sodium.h"
#include "../SingletonManager/MemoryManager.h"
#include "DataTypeConverter.h"
#include "Warning.h"

JsonRequest::JsonRequest(const std::string& serverHost, int serverPort)
	: mServerHost(serverHost), mServerPort(serverPort)
{
	if (mServerHost.data()[mServerHost.size() - 1] == '/') {
		mServerHost = mServerHost.substr(0, mServerHost.size() - 1);
	}

}

JsonRequest::~JsonRequest()
{

}

JsonRequestReturn JsonRequest::request(const char* methodName, const Poco::JSON::Object& requestJson)
{
	static const char* functionName = "JsonRequest::request";
	
	//requestJson.set("user", std::string(mSessionUser->getPublicKeyHex()));

	// send post request via https
	// 443 = HTTPS Default
	// TODO: adding port into ServerConfig
	try {
		Profiler phpRequestTime;
		
		Poco::SharedPtr<Poco::Net::HTTPClientSession> clientSession;
		if (mServerPort == 443) {
			clientSession = new Poco::Net::HTTPSClientSession(mServerHost, mServerPort);
		}
		else {
			clientSession = new Poco::Net::HTTPClientSession(mServerHost, mServerPort);
		}
		
		Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_POST, "/JsonRequestHandler");

		request.setChunkedTransferEncoding(true);
		
		
		std::ostream& request_stream = clientSession->sendRequest(request);
		requestJson.stringify(request_stream);

		Poco::Net::HTTPResponse response;
		std::istream& response_stream = clientSession->receiveResponse(response);

		// debugging answer

		std::stringstream responseStringStream;
		for (std::string line; std::getline(response_stream, line); ) {
			responseStringStream << line << std::endl;
		}
		Poco::Logger& speedLog = Poco::Logger::get("SpeedLog");
		std::string method_name(methodName);
		speedLog.information("[%s] php server time: %s", method_name, phpRequestTime.string());

		// extract parameter from request
		Poco::JSON::Parser jsonParser;
		Poco::Dynamic::Var parsedJson;
		try {
			parsedJson = jsonParser.parse(responseStringStream.str());
		}
		catch (Poco::Exception& ex) {
			addError(new ParamError(functionName, "error parsing request answer", ex.displayText().data()));
			std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d%m%yT%H%M%S");
			std::string log_Path = "/var/log/grd_login/";
			//#ifdef _WIN32
#if defined(_WIN32) || defined(_WIN64)
			log_Path = "./";
#endif
			std::string fileName = log_Path + dateTimeString + "_response_";
			fileName += methodName;
			fileName += ".html";

			FILE* f = fopen(fileName.data(), "wt");
			if (f) {
				std::string responseString = responseStringStream.str();
				fwrite(responseString.data(), 1, responseString.size(), f);
				fclose(f);
			}
			//	*/
			sendErrorsAsEmail(responseStringStream.str());
			return JSON_REQUEST_RETURN_PARSE_ERROR;
		}

		mResultJson = parsedJson.extract<Poco::JSON::Object::Ptr>();
		auto state = mResultJson->get("state");
		auto message = mResultJson->get("message");
		if (state.isEmpty() && !message.isEmpty()) {
			// than we have maybe get an cakephp exception as result
			
			addError(new ParamError(functionName, "cakePHP Exception: ", message.toString()));
			addError(new ParamError(functionName, "calling: ", methodName));
			addError(new ParamError(functionName, "for server host: ", mServerHost));
			std::string fields[] = { "url", "code", "file", "line" };
			for (int i = 0; i < 4; i++) {
				auto field = fields[i];
				std::string field_name = field + ": ";
				addError(new ParamError(functionName, field_name.data(), mResultJson->get(field).toString()));
			}
			sendErrorsAsEmail("", true);
			return JSON_REQUEST_RETURN_ERROR;
		}
		else {
			std::string stateString = state.convert<std::string>();
			if (stateString == "error") {
				addError(new Error(functionName, "php server return error"));
				if (!mResultJson->isNull("msg")) {
					addError(new ParamError(functionName, "msg:", mResultJson->get("msg").convert<std::string>().data()));
				}
				if (!mResultJson->isNull("details")) {
					addError(new ParamError(functionName, "details:", mResultJson->get("details").convert<std::string>().data()));
				}
				sendErrorsAsEmail("", true);
				return JSON_REQUEST_RETURN_ERROR;
			}
			else if (stateString == "success") {
				auto warnings_obj = mResultJson->get("warnings");
				if (!warnings_obj.isEmpty()) {
					Poco::JSON::Object warnings = *parsedJson.extract<Poco::JSON::Object::Ptr>();
					for (auto it = warnings.begin(); it != warnings.end(); it++) {
						addWarning(new Warning(it->first, it->second.toString()));
					}
				}
			}
		}
	}
	catch (Poco::Exception& e) {
		addError(new ParamError(functionName, "connect error to php server", e.displayText().data()));
		addError(new ParamError(functionName, "host", mServerHost));
		addError(new ParamError(functionName, "port", mServerPort));
		sendErrorsAsEmail();
		return JSON_REQUEST_CONNECT_ERROR;
	}

	return JSON_REQUEST_RETURN_OK;
}



JsonRequestReturn JsonRequest::request(const char* methodName, const Poco::Net::NameValueCollection& payload)
{
	Poco::JSON::Object requestJson;
	requestJson.set("method", methodName);

	for (auto it = payload.begin(); it != payload.end(); it++) {
		requestJson.set(it->first, it->second);
	}
	return request(methodName, requestJson);
}

JsonRequestReturn JsonRequest::request(const char* methodName)
{
	Poco::JSON::Object requestJson;
	requestJson.set("method", methodName);
	return request(methodName, requestJson);
}

	

