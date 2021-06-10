#include "gtest/gtest.h"

#include "JSONInterface/JsonUpdateUserInfos.h"
#include "TestJsonUpdateUserInfos.h"
#include "lib/Profiler.h"


void TestJsonUpdateUserInfos::SetUp()
{
	auto sm = SessionManager::getInstance();
	//sm->init();	
	mUserSession = sm->getNewSession();
	auto user = controller::User::create();
	user->getModel()->setEmail("Jeet_bb@gmail.com");
	mUserSession->setUser(user);
}

void TestJsonUpdateUserInfos::TearDown()
{
	auto sm = SessionManager::getInstance();
	if (!mUserSession) {
		sm->releaseSession(mUserSession);
	}
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
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);
	ASSERT_EQ(valid_values, 0);
	//User.password_old not found
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();

	ASSERT_EQ(error_array.size(), 1);
	ASSERT_EQ(error_array.getElement<std::string>(0), "User.password_old not found");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, OnlyOldPassword)
{
	JsonUpdateUserInfos jsonCall;
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password_old", "TestP4ssword&H");

	auto params = chooseAccount(update);
	auto result = jsonCall.handle(params);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);
	ASSERT_EQ(valid_values, 0);
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	ASSERT_EQ(error_array.size(), 0);

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, WrongPassword)
{
	JsonUpdateUserInfos jsonCall;
	mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H");
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "newPassword");
	update->set("User.password_old", "TestP4sswordH");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime-200);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);
	ASSERT_EQ(valid_values, 0);
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	ASSERT_EQ(error_array.size(), 1);
	ASSERT_EQ(error_array.getElement<std::string>(0), "User.password_old didn't match");

	delete result;
}