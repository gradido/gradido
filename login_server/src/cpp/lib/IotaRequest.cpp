#include "IotaRequest.h"
#include "lib/Profiler.h"

#include <algorithm>
#include <cctype>

#include "Poco/Net/HTTPSClientSession.h"
#include "Poco/Net/HTTPRequest.h"
#include "Poco/Net/HTTPResponse.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

#include "ServerConfig.h"

using namespace rapidjson;


IotaRequest::IotaRequest(const std::string& serverHost, int serverPort, const std::string& urlPath)
	: mServerHost(serverHost), mServerPort(serverPort), mUrlPath(urlPath)
{

}

IotaRequest::~IotaRequest()
{

}

std::vector<std::string> IotaRequest::getTips(Poco::SharedPtr<Poco::Net::HTTPClientSession> clientSession, NotificationList* errorReciver)
{
	static const char* functionName = "IotaRequest::getTips";
	Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_GET, mUrlPath + "tips", "HTTP/1.1");

	request.setChunkedTransferEncoding(false);
	std::ostream& request_stream = clientSession->sendRequest(request);

	Poco::Net::HTTPResponse response;
	auto json = parseResponse(clientSession->receiveResponse(response), errorReciver);
	std::vector<std::string> parentIds;
	try {
		Value& data = json["data"];
		auto tips = data["tipMessageIds"].GetArray();
		parentIds.reserve(tips.Size());
		for (auto it = tips.Begin(); it != tips.End(); it++) {
			parentIds.push_back(it->GetString());
		}
	}
	catch (std::exception& ex) {
		errorReciver->addError(new ParamError(functionName, "error iota response format changed", ex.what()));
	}
	return parentIds;
}



std::string IotaRequest::sendMessage(const std::string& indexHex, const std::string& messageHex, NotificationList* errorReciver)
{
	static const char* functionName = "IotaRequest::sendMessage";
	auto clientSession = createClientSession(errorReciver);
	if (clientSession.isNull()) {
		return "";
	}
	auto tips = getTips(clientSession, errorReciver);
	if (!tips.size()) {
		errorReciver->addError(new Error(functionName, "no get tips"));
		return "";
	}
	clientSession = createClientSession(errorReciver);

	Document requestJson(kObjectType);
	auto alloc = requestJson.GetAllocator();
	requestJson.AddMember("networkId", "", alloc);

	Value parentMessageIds(kArrayType);
//	int i = 0;
	for (auto it = tips.begin(); it != tips.end(); it++) {
		//if (i > 1) break;
		parentMessageIds.PushBack(Value(it->data(), alloc), alloc);
		//i++;
	}
	requestJson.AddMember("parentMessageIds", parentMessageIds, alloc);
	Value payload(kObjectType);
	payload.AddMember("type", 2, alloc);
	std::string upperIndex;
	for (int i = 0; i < indexHex.size(); i++) {
		upperIndex.push_back((std::toupper(indexHex.data()[i])));
	}
	std::string upperMessage;
	for (int i = 0; i < messageHex.size(); i++) {
		upperMessage.push_back((std::toupper(messageHex.data()[i])));
	}

	payload.AddMember("index", Value(indexHex.data(), alloc), alloc);
	payload.AddMember("data", Value(messageHex.data(), alloc), alloc);

	requestJson.AddMember("payload", payload, alloc);
	requestJson.AddMember("nonce", "", alloc);

	Poco::Net::HTTPRequest request(Poco::Net::HTTPRequest::HTTP_POST, mUrlPath + "messages", "HTTP/1.1");

	request.setChunkedTransferEncoding(true);
	request.setContentType("application/json");
	request.add("Accept", "*/*");
	std::ostream& request_stream = clientSession->sendRequest(request);

	StringBuffer buffer;
	Writer<StringBuffer> writer(buffer);
	requestJson.Accept(writer);
	auto requestString = std::string(buffer.GetString(), buffer.GetSize());
	printf("request: %s\n", requestString.data());
	request_stream << requestString;

	Poco::Net::HTTPResponse response;
	auto json = parseResponse(clientSession->receiveResponse(response), errorReciver);
	try {
		Value& data = json["data"];
		return data["messageId"].GetString();
	}
	catch (std::exception& ex) {
		errorReciver->addError(new ParamError(functionName, "iota response for post message has changed", ex.what()));
	}

	return "";
}

Poco::SharedPtr<Poco::Net::HTTPClientSession> IotaRequest::createClientSession(NotificationList* errorReciver)
{
	if (mServerHost.empty() || !mServerPort) {
		errorReciver->addError(new Error("IotaRequest::createClientSession", "server host or server port not given"));
		return nullptr;
	}
	try {
		Profiler iotaRequestTime;

		Poco::SharedPtr<Poco::Net::HTTPClientSession> clientSession;
		if (mServerPort == 443) {
			clientSession = new Poco::Net::HTTPSClientSession(mServerHost, mServerPort, ServerConfig::g_SSL_CLient_Context);
		}
		else {
			clientSession = new Poco::Net::HTTPClientSession(mServerHost, mServerPort);
		}
		return clientSession;
	}
	catch (Poco::Exception& ex) {
		errorReciver->addError(new ParamError("IotaRequest::createClientSession", "exception by creating client session", ex.displayText()));
		return nullptr;
	}
}

Document IotaRequest::parseResponse(std::istream& responseStream, NotificationList* errorReciver)
{
	static const char* functionName = "IotaRequest::parseResponse";
	std::stringstream responseStringStream;
	for (std::string line; std::getline(responseStream, line); ) {
		responseStringStream << line << std::endl;
	}
	printf("response:\n%s\n", responseStringStream.str().data());

	Document result;
	// extract parameter from request
	result.Parse(responseStringStream.str().data());

	if (result.HasParseError()) {
		errorReciver->addError(new ParamError(functionName, "error parsing request answer", result.GetParseError()));
		errorReciver->addError(new ParamError(functionName, "position of last parsing error", result.GetErrorOffset()));
	}
	return result;
}
