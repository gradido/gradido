#include "ElopageWebhookLight.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/URI.h"
#include "Poco/Logger.h"
#include "Poco/Data/Binding.h"
#include "Poco/FileStream.h"




void ElopageWebhookLight::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	//ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");

	// empty response, we didn't need to set anything
	//response.setStatus(Poco::Net::HTTPResponse::HTTP_NO_CONTENT);
	std::ostream& _responseStream = response.send();
	_responseStream << "200 OK";

	// don't use it anymore, register now direct 
	// elopage request are only logged from gpt server
	return;

	std::istream& stream = request.stream();
	std::string completeRequest;
	Poco::Net::NameValueCollection elopageRequestData;
	int breakCount = 100;
	while (stream.good() && breakCount > 0) {
		//		char dummy;
		std::string line;
		std::getline(stream, line);
		completeRequest += line;
		
		stream.good();
		breakCount--;
	}

	// write stream result also to file
	static Poco::Mutex mutex;
	Profiler timeUsed;
	mutex.lock();

	Poco::FileOutputStream file("elopage_webhook_requests_2.txt", std::ios::out | std::ios::app);

	if (!file.good()) {
		Poco::Logger& logging(Poco::Logger::get("errorLog"));
		logging.error("[ElopageWebhookLight::handleRequest] error creating file with name: elopage_webhook_requests_2.txt");
		//printf("[ElopageWebhook::handleRequest] error creating file with name: elopage_webhook_requests.txt\n");
		mutex.unlock();
		return;
	}

	Poco::LocalDateTime now;

	std::string dateTimeStr = Poco::DateTimeFormatter::format(now, Poco::DateTimeFormat::ISO8601_FORMAT);
	file << dateTimeStr << std::endl;
	file << completeRequest << std::endl;
	file << std::endl;
	file.close();
	std::string timeUsedStr = timeUsed.string();
	printf("[%s] time for elopage request light write to file and maybe wait on lock: %s\n", dateTimeStr.data(), timeUsedStr.data());
	mutex.unlock();

}

