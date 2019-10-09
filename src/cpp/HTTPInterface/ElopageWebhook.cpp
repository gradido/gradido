#include "ElopageWebhook.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/DeflatingStream.h"

#include "../ServerConfig.h"


void ElopageWebhook::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");

	response.setChunkedTransferEncoding(true);
	response.setContentType("application/json");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	
	if (_compressResponse) _gzipStream.close();
}
