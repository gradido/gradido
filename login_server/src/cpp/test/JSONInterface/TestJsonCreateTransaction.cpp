#include "TestJsonCreateTransaction.h"

#include "JSONInterface/JsonCreateTransaction.h"

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


Poco::JSON::Object::Ptr TestJsonCreateTransaction::basisSetup()
{
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("session_id", mUserSession->getHandle());
	params->set("blockchain_type", "mysql");
	params->set("memo", "Placolder for memo for test");
	params->set("auto_sign", true);

	return params;
}

TEST_F(TestJsonCreateTransaction, Creation)
{
	JsonCreateTransaction jsonCall;
	
	auto params = basisSetup();
	params->set("transaction_type", "creation");
	params->set("target_email", "Elfenhausen@arcor.de");
	params->set("amount", 10000000);
	params->set("target_date", "2021-07-13T13:00:00");
	
	auto result = jsonCall.handle(params);
	std::stringstream ss;
	result->stringify(ss);
	printf("result: %s\n", ss.str().data());
	//*/
}