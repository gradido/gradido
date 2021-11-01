#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "JSONInterface/JsonGetUsers.h"

using namespace rapidjson;

TEST(TestJsonGetUsers, NO_ADMIN)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("d_schultz32@gmx.de");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("search", "b", alloc);
	params.AddMember("session_id", session->getHandle(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "wrong role");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "User hasn't correct role");

	sm->releaseSession(session);
}

TEST(TestJsonGetUsers, INVALID_SESSION)
{	
	JsonGetUsers jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("search", "", alloc);
	params.AddMember("session_id", rand(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "not found");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "session not found");
}

TEST(TestJsonGetUsers, EMPTY_SEARCH)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Tiger_231@yahoo.com");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("search", "", alloc);
	params.AddMember("session_id", session->getHandle(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "not found");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "Search string is empty and account_state is all or empty");

	sm->releaseSession(session);
}

TEST(TestJsonGetUsers, VALID_SEARCH)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Tiger_231@yahoo.com");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("search", "a", alloc);
	params.AddMember("session_id", session->getHandle(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "");

	
	EXPECT_FALSE(jsonCall.checkArrayParameter(result, "users").IsObject());
	auto users = result.FindMember("users");
	ASSERT_EQ(users->value.Size(), 6);

	sm->releaseSession(session);
}

TEST(TestJsonGetUsers, VALID_STATE_SEARCH)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Tiger_231@yahoo.com");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();

	params.AddMember("search", "", alloc);
	params.AddMember("account_state", "email not activated", alloc);
	params.AddMember("session_id", session->getHandle(), alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "");

	EXPECT_FALSE(jsonCall.checkArrayParameter(result, "users").IsObject());
	auto users = result.FindMember("users");
	ASSERT_EQ(users->value.Size(), 1);

	sm->releaseSession(session);
}

