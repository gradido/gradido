#include "gtest/gtest.h"

#include "JSONInterface/JsonCheckUsername.h"

using namespace rapidjson;

TEST(TestJsonCheckUsername, InvalidGroupAlias)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("group_alias", "robert", alloc);
	Document result;
 	result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "error");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "unknown group");
}

TEST(TestJsonCheckUsername, InvalidGroupId)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("group_id", 4, alloc);
	auto result = jsonCall.handle(params);

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "unknown group");
}

TEST(TestJsonCheckUsername, ValidGroupAlias)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("group_alias", "gdd1", alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");

	int group_id = 0;
	jsonCall.getIntParameter(result, "group_id", group_id);
	ASSERT_EQ(group_id, 1);

}

TEST(TestJsonCheckUsername, UsernameWithoutGroup)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("username", "maxi", alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "error");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "no group given");
}

TEST(TestJsonCheckUsername, ExistingUsername)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("username", "Erfinder", alloc);
	params.AddMember("group_id", 1, alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "warning");

	std::string msg;
	jsonCall.getStringParameter(result, "msg", msg);
	ASSERT_EQ(msg, "username already in use");
}

TEST(TestJsonCheckUsername, NewUsername)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("username", "Maxi", alloc);
	params.AddMember("group_id", 1, alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");	
}

TEST(TestJsonCheckUsername, UsernameExistInOtherGroup)
{
	JsonCheckUsername jsonCall;
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	params.AddMember("username", "Erfinder", alloc);
	params.AddMember("group_id", 2, alloc);
	auto result = jsonCall.handle(params);

	std::string state;
	jsonCall.getStringParameter(result, "state", state);
	ASSERT_EQ(state, "success");
}


