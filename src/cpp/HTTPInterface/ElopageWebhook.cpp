#include "ElopageWebhook.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/DeflatingStream.h"

#include "../ServerConfig.h"


void ElopageWebhook::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	//ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");


	std::istream& stream = request.stream();
	Poco::Net::NameValueCollection elopageRequestData;
	while (!stream.eof()) {
		char keyBuffer[30]; memset(keyBuffer, 0, 30);
		char valueBuffer[35]; memset(valueBuffer, 0, 35);
		stream.get(keyBuffer, 30, '=')
			  .get(valueBuffer, 35, '&');
		printf("[ElopageWebhook::handleRequest] key: %s, value: %s\n", keyBuffer, valueBuffer);
		elopageRequestData.set(keyBuffer, valueBuffer);
	}
	UniLib::controller::TaskPtr handleElopageTask(new HandleElopageRequestTask(elopageRequestData));
	handleElopageTask->scheduleTask(handleElopageTask);

	response.setChunkedTransferEncoding(true);
	response.setContentType("application/json");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	
	if (_compressResponse) _gzipStream.close();
}


// ****************************************************************************
HandleElopageRequestTask::HandleElopageRequestTask(Poco::Net::NameValueCollection& requestData)
	: CPUTask(ServerConfig::g_CPUScheduler), mRequestData(requestData) 
{
}

int HandleElopageRequestTask::run()
{
	printf("[HandleElopageRequestTask::run]\n");
	for (auto it = mRequestData.begin(); it != mRequestData.end(); it++) {
		printf("%s => %s\n", it->first.data(), it->second.data());
	}
	printf("[HandleElopageRequestTask::run] end\n");
	return 0;
}