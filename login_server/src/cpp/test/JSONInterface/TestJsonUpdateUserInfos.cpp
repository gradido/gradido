#include "gtest/gtest.h"

#include "JSONInterface/JsonUpdateUserInfos.h"
#include "TestJsonUpdateUserInfos.h"


void TestJsonUpdateUserInfos::SetUp()
{
	auto sm = SessionManager::getInstance();
	sm->init();
	mUserSession = sm->getNewSession();
	mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H");
}

void TestJsonUpdateUserInfos::TearDown()
{
	auto sm = SessionManager::getInstance();
	if (!mUserSession) {
		sm->releaseSession(mUserSession);
	}
	sm->deinitalize();
}

Poco::JSON::Object::Ptr TestJsonUpdateUserInfos::chooseAccount(const Poco::JSON::Object::Ptr update)
{
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("session_id", mUserSession->getHandle());
	params->set("email", mUserSession->getNewUser()->getModel()->getEmail());
	params->set("update", update);
	return params;
}

TEST_F(TestJsonUpdateUserInfos, EmptyOldPassword)
{
	JsonUpdateUserInfos jsonCall;
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;
	
	update->set("User.password", "haLL1o_/%s");

	auto params = chooseAccount(update);
	auto result = jsonCall.handle(params);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	//User.password_old not found
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();

	ASSERT_EQ(error_array.size(), 1);
	ASSERT_EQ(error_array.getElement<std::string>(0), "User.password_old not found");

	delete result;
}