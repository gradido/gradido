#include "HandleFileRequest.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/DeflatingStream.h"
#include "Poco/FileStream.h"

void HandleFileRequest::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);

	std::string uri = request.getURI();
	// check endung
	size_t last_point = uri.find_last_of('.');
	std::string endung = uri.substr(last_point+1);

	std::string mediaType;

	//printf("endung: %s\n", endung.data());
	if (endung == "css") {
		mediaType = "text/css";
	}
	else if (endung == "js") {
		mediaType = "text/javascript";
	}
	else if (endung == "ico") {
		mediaType = "image/x-icon";
	}
	std::string path = "data" + uri;
	printf("file path: %s\n", path.data());
	response.sendFile(path, mediaType);
/*
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << new Poco::FileInputStream("./data/" + uri);
	if (_compressResponse) _gzipStream.close();
	*/
}
