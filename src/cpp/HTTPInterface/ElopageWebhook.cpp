#include "ElopageWebhook.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/DeflatingStream.h"
#include "Poco/URI.h"

#include "../ServerConfig.h"


void ElopageWebhook::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	//ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");


	std::istream& stream = request.stream();
	Poco::Net::NameValueCollection elopageRequestData;
	int breakCount = 100;
	while (stream.good() && breakCount > 0) {
		char dummy;
		char keyBuffer[30]; memset(keyBuffer, 0, 30);
		char valueBuffer[75]; memset(valueBuffer, 0, 75);
		/*stream.get(keyBuffer, 30, '=').get(dummy)
			  .get(valueBuffer, 35, '&').get(dummy);*/
		std::string line;
		std::getline(stream, line);
		int mode = 0;
		int cursor = 0;
		for (int i = 0; i < line.size(); i++) {
			char c = line.at(i);
			if (c == '\n') break;
			if (c == '+') {
				c = ' ';
			}
			if (c == '&') {
				mode = 0;
				cursor = 0;
				std::string urlDecodedValue;
				Poco::URI::decode(valueBuffer, urlDecodedValue);
				elopageRequestData.set(keyBuffer, urlDecodedValue);
				memset(keyBuffer, 0, 30);
				memset(valueBuffer, 0, 75);
				continue;
			}
			switch (mode) {
			case 0: // read key
				if (c == '=') {
					mode = 1;
					cursor = 0;
					continue;
				}
				if (cursor < 29) {
					keyBuffer[cursor++] = c;
				}
				else {
					int zahl = 1;
				}
				break;
			case 1: // read value
				if (cursor < 74) {
					valueBuffer[cursor++] = c;
				}
				else {
					int zahl = 1;
				}
				break;
			}
		}
		//printf("[ElopageWebhook::handleRequest] key: %s, value: %s\n", keyBuffer, valueBuffer);
	///	elopageRequestData.set(keyBuffer, valueBuffer);
		stream.good();
		breakCount--;
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