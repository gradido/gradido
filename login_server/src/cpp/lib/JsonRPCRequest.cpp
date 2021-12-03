#include "JsonRPCRequest.h"

#include "Profiler.h"


#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

#include "sodium.h"
#include "SingletonManager/MemoryManager.h"
#include "DataTypeConverter.h"
#include "JSONInterface/JsonRequestHandler.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/pointer.h"

using namespace rapidjson;

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

Document JsonRPCRequest::request(const char* methodName, Value& params)
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

		Document requestJson(kObjectType);
		auto alloc = requestJson.GetAllocator();

		requestJson.AddMember("jsonrpc", "2.0", alloc);
		requestJson.AddMember("id", rand(), alloc);
		requestJson.AddMember("method", Value(methodName, alloc), alloc);
		requestJson.AddMember("params", params, alloc);

		request.setChunkedTransferEncoding(true);
		std::ostream& request_stream = clientSession->sendRequest(request);
		StringBuffer buffer;
		Writer<StringBuffer> writer(buffer);
		requestJson.Accept(writer);
		request_stream << buffer.GetString(); 

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
		Document jsonAnswear;
		jsonAnswear.Parse(responseStringStream.str().data());
		if(jsonAnswear.HasParseError())
		{
			addError(new ParamError(functionName, "error parsing request answer", jsonAnswear.GetParseError()));
			addError(new ParamError(functionName, "parsing error offset", jsonAnswear.GetErrorOffset()));

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

		std::string state;		
		Value& stateValue = Pointer("/result/state").GetWithDefault(jsonAnswear, "");
		if (stateValue.GetStringLength()) {
			state = stateValue.GetString();
		}
				
		if (state == "error") {
			addError(new Error(functionName, "node server return error"));
			Value& msg = Pointer("/result/msg").GetWithDefault(jsonAnswear, "");
			if (msg.GetStringLength()) {
				addError(new ParamError(functionName, "msg:", msg.GetString()));
			}
			Value& details = Pointer("/result/details").GetWithDefault(jsonAnswear, "");
			if (details.GetStringLength()) {
				addError(new ParamError(functionName, "details:", details.GetString()));
			}
			sendErrorsAsEmail();
			return nullptr;
		}
		else if (state == "success") {
			/*for (auto it = result->begin(); it != result->end(); it++) {
				std::string index = it->first;
				std::string value = it->second.toString();
				printf("[JsonRequest] %s: %s\n", index.data(), value.data());
			}*/
			return jsonAnswear;
		}
	}
	catch (Poco::Exception& e) {
		addError(new ParamError(functionName, "connect error to node server", e.displayText().data()));
		sendErrorsAsEmail();
		return nullptr;
	}

	return nullptr;
}