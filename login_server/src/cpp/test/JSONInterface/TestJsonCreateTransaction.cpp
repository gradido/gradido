#include "TestJsonCreateTransaction.h"

#include "JSONInterface/JsonCreateTransaction.h"

#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

using namespace rapidjson;

void TestJsonCreateTransaction::SetUp()
{
	auto sm = SessionManager::getInstance();
	//sm->init();	
	mUserSession = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Jeet_bb@gmail.com");
	user->login("TestP4ssword&H");
	mUserSession->setUser(user);
}

void TestJsonCreateTransaction::TearDown()
{
	auto sm = SessionManager::getInstance();
	if (!mUserSession) {
		sm->releaseSession(mUserSession);
	}
}


Document TestJsonCreateTransaction::basisSetup()
{
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("session_id", mUserSession->getHandle(), alloc);
	params.AddMember("blockchain_type", "mysql", alloc);
	params.AddMember("memo", "Placeholder for memo for test", alloc);
	params.AddMember("auto_sign", true, alloc);

	return params;
}

TEST_F(TestJsonCreateTransaction, Creation)
{
	JsonCreateTransaction jsonCall;
	
	auto params = basisSetup();
	auto alloc = params.GetAllocator();
	params.AddMember("transaction_type", "creation", alloc);
	params.AddMember("target_email", "Elfenhausen@arcor.de", alloc);
	params.AddMember("amount", 10000000, alloc);
	params.AddMember("target_date", "2021-07-13T13:00:00", alloc);
	
	auto result = jsonCall.handle(params);
	StringBuffer buffer;
	Writer<StringBuffer> writer(buffer);
	result.Accept(writer);

	printf("result: %s\n", buffer.GetString());
	//*/
}