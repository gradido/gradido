#include "TestJsonCreateTransaction.h"

#include "JSONInterface/JsonCreateTransaction.h"

void TestJsonCreateTransaction::SetUp()
{
	auto sm = SessionManager::getInstance();
	//sm->init();	
	mUserSession = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Jeet_bb@gmail.com");
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
	
	return params;
}

TEST_F(TestJsonCreateTransaction, Creation)
{
	JsonCreateTransaction jsonCall;
	
	auto params = basisSetup();
	params->set("transaction_type", "creation");
	
	auto result = jsonCall.handle(params);
}