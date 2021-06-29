#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/JSON/Object.h"

#include "JSONInterface/JsonGetUsers.h"

TEST(TestJsonGetUsers, NO_ADMIN)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("d_schultz32@gmx.de");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("search", "b");
	params->set("session_id", session->getHandle());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "wrong role");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "User hasn't correct role");

	sm->releaseSession(session);
}

TEST(TestJsonGetUsers, INVALID_SESSION)
{
	
	JsonGetUsers jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("search", "");
	params->set("session_id", rand());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "not found");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "Session not found");
}

TEST(TestJsonGetUsers, EMPTY_SEARCH)
{
	auto sm = SessionManager::getInstance();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Tiger_231@yahoo.com");
	session->setUser(user);

	JsonGetUsers jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("search", "");
	params->set("session_id", session->getHandle());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "not found");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "Search string is empty and account_state is all or empty");

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
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("search", "a");
	params->set("session_id", session->getHandle());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	auto msg = result->get("msg");
	ASSERT_TRUE(msg.isEmpty());

	EXPECT_TRUE(result->isArray("users"));
	auto users = result->getArray("users");
	ASSERT_FALSE(users.isNull());
		
	ASSERT_EQ(users->size(), 6);

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
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("search", "");
	params->set("account_state", "email not activated");
	params->set("session_id", session->getHandle());
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	auto msg = result->get("msg");
	ASSERT_TRUE(msg.isEmpty());

	EXPECT_TRUE(result->isArray("users"));
	auto users = result->getArray("users");
	ASSERT_FALSE(users.isNull());

	ASSERT_EQ(users->size(), 1);

	sm->releaseSession(session);
}

