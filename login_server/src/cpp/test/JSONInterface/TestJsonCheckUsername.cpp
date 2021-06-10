#include "gtest/gtest.h"

#include "JSONInterface/JsonCheckUsername.h"

TEST(TestJsonCheckUsername, InvalidGroupAlias)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("group_alias", "robert");
	auto result = jsonCall.handle(params);
	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "unknown group");

	delete result;
}

TEST(TestJsonCheckUsername, InvalidGroupId)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("group_id", "4");
	auto result = jsonCall.handle(params);
	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "unknown group");

	delete result;
}

TEST(TestJsonCheckUsername, ValidGroupAlias)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("group_alias", "gdd1");
	auto result = jsonCall.handle(params);
	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	auto group_id = result->get("group_id");
	ASSERT_FALSE(group_id.isEmpty());
	ASSERT_TRUE(group_id.isInteger());
	int group_id_int = 0;
	group_id.convert(group_id_int);
	ASSERT_EQ(group_id_int, 1);

	delete result;
}

TEST(TestJsonCheckUsername, UsernameWithoutGroup)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("username", "maxi");
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "no group given");
	
	delete result;
}

TEST(TestJsonCheckUsername, ExistingUsername)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("username", "Erfinder");
	params->set("group_id", 1);
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "warning");

	auto msg = result->get("msg");
	ASSERT_FALSE(msg.isEmpty());
	ASSERT_TRUE(msg.isString());
	ASSERT_EQ(msg.toString(), "username already in use");

	delete result;
}

TEST(TestJsonCheckUsername, NewUsername)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("username", "Maxi");
	params->set("group_id", 1);
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	delete result;
}

TEST(TestJsonCheckUsername, UsernameExistInOtherGroup)
{
	JsonCheckUsername jsonCall;
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("username", "Erfinder");
	params->set("group_id", 2);
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	delete result;
}


