
#include "JsonRequest.h"
#include "Profiler.h"

#include "JSONInterface/JsonRequestHandler.h"

#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

#include "sodium.h"
#include "../SingletonManager/MemoryManager.h"
#include "DataTypeConverter.h"
#include "Warning.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

using namespace rapidjson;

JsonRequest::JsonRequest(const std::string& serverHost, int serverPort)
	: mServerHost(serverHost), mServerPort(serverPort), mJsonDocument(kObjectType)
{
	if (mServerHost.data()[mServerHost.size() - 1] == '/') {
		mServerHost = mServerHost.substr(0, mServerHost.size() - 1);
	}
}

JsonRequest::~JsonRequest()
{

}

JsonRequestReturn JsonRequest::request(const char* methodName, rapidjson::Value& payload)
{
	auto alloc = mJsonDocument.GetAllocator();
	if (payload.IsObject()) {

		for (auto it = payload.MemberBegin(); it != payload.MemberEnd(); it++) {
			mJsonDocument.AddMember(it->name, it->value, alloc);
		}
	}
	return request(methodName);
}

JsonRequestReturn JsonRequest::request(const char* methodName)
{
	static const char* functionName = "JsonRequest::request";

	auto alloc = mJsonDocument.GetAllocator();
	mJsonDocument.AddMember("method", Value(methodName, alloc), alloc);

	if (mServerHost.empty() || !mServerPort) {
		addError(new Error(functionName, "server host or server port not given"));
		return JSON_REQUEST_PARAMETER_ERROR;
	}
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

		StringBuffer buffer;
		Writer<StringBuffer> writer(buffer);
		mJsonDocument.Accept(writer);
		request_stream << std::string(buffer.GetString(), buffer.GetSize());

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
		Document resultJson;
		resultJson.Parse(responseStringStream.str().data());
		
		if(resultJson.HasParseError()) 
		{
			addError(new ParamError(functionName, "error parsing request answer", resultJson.GetParseError()));
			addError(new ParamError(functionName, "position of last parsing error", resultJson.GetErrorOffset()));
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

		if (!resultJson.HasMember("state") && resultJson.HasMember("message")) {
			// than we have maybe get an cakephp exception as result
			std::string message;
			JsonRequestHandler::getStringParameter(resultJson, "message", message);
			addError(new ParamError(functionName, "cakePHP Exception: ", message));
			addError(new ParamError(functionName, "calling: ", methodName));
			addError(new ParamError(functionName, "for server host: ", mServerHost));
			std::string fields[] = { "url", "code", "file", "line" };
			for (int i = 0; i < 4; i++) {
				auto field = fields[i];
				std::string field_name = field + ": ";
				std::string value;
				JsonRequestHandler::getStringParameter(resultJson, field.data(), value);
				addError(new ParamError(functionName, field_name.data(), value));
			}
			sendErrorsAsEmail("", true);
			return JSON_REQUEST_RETURN_ERROR;
		}
		else {
			std::string stateString;
			JsonRequestHandler::getStringParameter(resultJson, "state", stateString);
			if (stateString == "error") {
				addError(new Error(functionName, "php server return error"));
				std::string msg;
				JsonRequestHandler::getStringParameter(resultJson, "msg", msg);
				if (msg != "") {
					addError(new ParamError(functionName, "msg:", msg));
				}

				std::string details;
				JsonRequestHandler::getStringParameter(resultJson, "details", details);
				if (details != "") {
					addError(new ParamError(functionName, "details:", details));
				}
				sendErrorsAsEmail("", true);
				return JSON_REQUEST_RETURN_ERROR;
			}
			else if (stateString == "success") {
				auto it = resultJson.FindMember("warnings");
				if (it != resultJson.MemberEnd()) {
					const Value& warnings = it->value;
					for (auto it = warnings.MemberBegin(); it != warnings.MemberEnd(); it++) {
						if (!it->name.IsString() || !it->value.IsString()) {
							continue;
						}
						std::string name(it->name.GetString(), it->name.GetStringLength());
						std::string value(it->value.GetString(), it->value.GetStringLength());
						
						addWarning(new Warning(name, value));
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




