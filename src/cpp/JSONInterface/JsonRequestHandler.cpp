#include "JsonRequestHandler.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"

#include "Poco/URI.h"
#include "Poco/DeflatingStream.h"

#include "Poco/JSON/Parser.h"

#include "../ServerConfig.h"

#include "../lib/DataTypeConverter.h"

void JsonRequestHandler::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{

	response.setChunkedTransferEncoding(false);
	response.setContentType("application/json");
	if (ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_CORS_ALL) {
		response.set("Access-Control-Allow-Origin", "*");
		response.set("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	}
	//bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	//if (_compressResponse) response.set("Content-Encoding", "gzip");

	std::ostream& responseStream = response.send();
	//Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	//std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;

	auto method = request.getMethod();
	std::istream& request_stream = request.stream();
	Poco::JSON::Object* json_result = nullptr;
	if (method == "POST" || method == "PUT") {
		// extract parameter from request
		Poco::Dynamic::Var parsedResult = parseJsonWithErrorPrintFile(request_stream);
	
		if (parsedResult.size() != 0) {
			json_result = handle(parsedResult);
		}
		else {
			json_result = stateError("empty body");
		}

	}
	else if(method == "GET") {		
		Poco::URI uri(request.getURI());
		auto queryParameters = uri.getQueryParameters();
		json_result = handle(queryParameters);
	}

	if (json_result) {
		json_result->stringify(responseStream);
		delete json_result;
	}

	//if (_compressResponse) _gzipStream.close();
}


Poco::Dynamic::Var JsonRequestHandler::parseJsonWithErrorPrintFile(std::istream& request_stream, ErrorList* errorHandler /* = nullptr*/, const char* functionName /* = nullptr*/)
{
	// debugging answer

	std::stringstream responseStringStream;
	for (std::string line; std::getline(request_stream, line); ) {
		responseStringStream << line << std::endl;
	}

	// extract parameter from request
	Poco::JSON::Parser jsonParser;
	Poco::Dynamic::Var parsedJson;
	try {
		parsedJson = jsonParser.parse(responseStringStream.str());

		return parsedJson;
	}
	catch (Poco::Exception& ex) {
		if (errorHandler) {
			errorHandler->addError(new ParamError(functionName, "error parsing request answer", ex.displayText().data()));
			errorHandler->sendErrorsAsEmail(responseStringStream.str());
		} 
		std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d_%m_%yT%H_%M_%S");
		std::string filename = dateTimeString + "_response.html";
		FILE* f = fopen(filename.data(), "wt");
		if (f) {
			std::string responseString = responseStringStream.str();
			fwrite(responseString.data(), 1, responseString.size(), f);
			fclose(f);
		}
		return Poco::Dynamic::Var();
	}
	return Poco::Dynamic::Var();
}

Poco::JSON::Object* JsonRequestHandler::stateError(const char* msg, std::string details)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "error");
	result->set("msg", msg);
	if (details != "") {
		result->set("details", details);
	}
	return result;
}

Poco::JSON::Object* JsonRequestHandler::stateSuccess()
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	return result;
}

Poco::JSON::Object* JsonRequestHandler::customStateError(const char* state, const char* msg, std::string details/* = ""*/)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", state);
	result->set("msg", msg);
	if (details != "") {
		result->set("details", details);
	}
	return result;
}

