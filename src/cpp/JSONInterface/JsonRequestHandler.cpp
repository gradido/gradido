#include "JsonRequestHandler.h"

#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"

#include "Poco/URI.h"
#include "Poco/DeflatingStream.h"

#include "Poco/JSON/Parser.h"



void JsonRequestHandler::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{

	response.setChunkedTransferEncoding(true);
	response.setContentType("application/json");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;

	auto method = request.getMethod();
	std::istream& request_stream = request.stream();
	Poco::JSON::Object json_result;
	if (method == "POST") {
		// extract parameter from request
		Poco::JSON::Parser jsonParser;
		try {
			auto params = jsonParser.parse(request_stream);
			// call logic
			json_result = handle(params);
		}
		catch (Poco::Exception& ex) {
			printf("[JsonRequestHandler::handleRequest] Exception: %s\n", ex.displayText().data());
		}
	}
	else if(method == "GET") {		
		Poco::URI uri(request.getURI());
		auto queryParameters = uri.getQueryParameters();
		json_result = handle(queryParameters);
	}
	json_result.stringify(responseStream);

	if (_compressResponse) _gzipStream.close();
}
