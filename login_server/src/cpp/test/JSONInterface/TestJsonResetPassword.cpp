#include "gtest/gtest.h"

#include "JSONInterface/JsonResetPassword.h"
#include "TestJsonResetPassword.h"
#include "lib/Profiler.h"

using namespace rapidjson;

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
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("password", "ashze_Sja/63", alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "error");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "session_id not found");

}

TEST_F(TestJsonResetPassword, WithoutPassword)
{
	JsonResetPassword jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("session_id", mUserSession->getHandle(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "error");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "password not found");
}

TEST_F(TestJsonResetPassword, InvalidPassword)
{
	JsonResetPassword jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("session_id", mUserSession->getHandle(), alloc);
	params.AddMember("password", "ash", alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	
	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) == ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) {
		ASSERT_EQ(state, "success");
	}
	else {
		ASSERT_EQ(state, "error");

		std::string msg;
		jsonCall.getStringParameter(result, "msg", msg);
		ASSERT_EQ(msg, "Password: Your password is to short!");
	}
}

TEST_F(TestJsonResetPassword, ValidPassword)
{
	JsonResetPassword jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("session_id", mUserSession->getHandle(), alloc);
	params.AddMember("password", "hath6/&Sja", alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");
}
