#include "JsonRPCRequest.h"

#include "Profiler.h"


#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"
#include "Poco/JSON/Parser.h"

#include "sodium.h"
#include "../SingletonManager/MemoryManager.h"
#include "DataTypeConverter.h"


JsonRPCRequest::JsonRPCRequest(const std::string& serverHost, int serverPort)
	: JsonRequest(serverHost, serverPort)
{

	if (serverHost.find("http://") != serverHost.npos) {
		mServerHost = serverHost.substr(7);
	}
	else if (serverHost.find("https://") != serverHost.npos) {
		mServerHost = serverHost.substr(8);
	}
}

JsonRPCRequest::~JsonRPCRequest()
{

}

Poco::JSON::Object::Ptr JsonRPCRequest::request(const char* methodName, const Poco::JSON::Object& params)
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
		//Poco::Net::HTTPSClientSession httpsClientSession(mServerHost, mServerPort);
		Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_POST, "/", "HTTP/1.1");
		//request.setContentType("application/json");

		Poco::JSON::Object requestJson;

		requestJson.set("jsonrpc", "2.0");
		requestJson.set("id", rand());
		requestJson.set("method", methodName);
		requestJson.set("params", params);

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
		speedLog.information("[%s] node server time: %s", method_name, phpRequestTime.string());

		if (responseStringStream.str().size() == 0) {
			addError(new Error(functionName, "empty request answer"));
			addError(new ParamError(functionName, "server host: ", mServerHost));
			addError(new ParamError(functionName, "server port", mServerPort));
			addError(new ParamError(functionName, "method: ", methodName));
			sendErrorsAsEmail();
			return nullptr;
		}

		// extract parameter from request
		Poco::JSON::Parser jsonParser;
		Poco::Dynamic::Var parsedJson;
		try {
			parsedJson = jsonParser.parse(responseStringStream.str());
		}
		catch (Poco::Exception& ex) {
			addError(new ParamError(functionName, "error parsing request answer", ex.displayText().data()));

			std::string fileName = "node_response_";
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
			return nullptr;
		}

		auto object = parsedJson.extract<Poco::JSON::Object::Ptr>();
		auto result = object->getObject("result");
		auto state = result->get("state");
		
		std::string stateString = state.convert<std::string>();
		if (stateString == "error") {
			addError(new Error(functionName, "node server return error"));
			if (!result->isNull("msg")) {
				addError(new ParamError(functionName, "msg:", result->get("msg").convert<std::string>().data()));
			}
			if (!result->isNull("details")) {
				addError(new ParamError(functionName, "details:", result->get("details").convert<std::string>().data()));
			}
			sendErrorsAsEmail();
			return nullptr;
		}
		else if (stateString == "success") {
			/*for (auto it = result->begin(); it != result->end(); it++) {
				std::string index = it->first;
				std::string value = it->second.toString();
				printf("[JsonRequest] %s: %s\n", index.data(), value.data());
			}*/
			return object;
		}
	}
	catch (Poco::Exception& e) {
		addError(new ParamError(functionName, "connect error to node server", e.displayText().data()));
		sendErrorsAsEmail();
		return nullptr;
	}

	return nullptr;
}