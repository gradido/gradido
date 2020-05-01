#ifndef Elopage_Webhook_INCLUDED
#define Elopage_Webhook_INCLUDED


#include "PageRequestMessagedHandler.h"
#include "../tasks/CPUTask.h"
#include "../lib/ErrorList.h"

#include "Poco/Net/NameValueCollection.h"

class ElopageWebhook : public PageRequestMessagedHandler
{
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);
};

class HandleElopageRequestTask : public UniLib::controller::CPUTask, protected ErrorList
{
public:
	HandleElopageRequestTask(Poco::Net::NameValueCollection& requestData);
		

	const char* getResourceType() const { return "HandleElopageRequestTask"; };
	int run();

protected:

	// return true if at least one entry in db with this email exist
	bool validateInput();
	void writeUserIntoDB();
	int getUserIdFromDB(bool checkEmail = false);

	Poco::Net::NameValueCollection mRequestData; 
	std::string mEmail;
	std::string mFirstName;
	std::string mLastName;
};


#endif // Elopage_Webhook_INCLUDED
