#include "gtest/gtest.h"

#include "JSONInterface/JsonResetPassword.h"
#include "TestJsonResetPassword.h"
#include "lib/Profiler.h"


void TestJsonResetPassword::SetUp()
{
	auto sm = SessionManager::getInstance();
	//sm->init();	
	mUserSession = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Nikola_Tesla@email.de");
	mUserSession->setUser(user);
}

void TestJsonResetPassword::TearDown()
{
	auto sm = SessionManager::getInstance();
	if (!mUserSession) {
		sm->releaseSession(mUserSession);
	}
}


TEST_F(TestJsonResetPassword, WithoutSession)
{
	JsonResetPassword jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("password", "ashze_Sja/63");
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "missing session_id");

}

TEST_F(TestJsonResetPassword, WithoutPassword)
{
	JsonResetPassword jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("session_id", mUserSession->getHandle());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "password missing");
}

TEST_F(TestJsonResetPassword, InvalidPassword)
{
	JsonResetPassword jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("session_id", mUserSession->getHandle());
	params->set("password", "ash");
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) == ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) {
		ASSERT_EQ(state.toString(), "success");
	}
	else {
		ASSERT_EQ(state.toString(), "error");

		auto msg = result->get("msg");
		ASSERT_FALSE(msg.isEmpty());
		ASSERT_TRUE(msg.isString());
		ASSERT_EQ(msg.toString(), "password isn't valid");
	}
}

TEST_F(TestJsonResetPassword, ValidPassword)
{
	JsonResetPassword jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("session_id", mUserSession->getHandle());
	params->set("password", "hath6/&Sja");
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");
}
