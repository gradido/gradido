#include "gtest/gtest.h"

#include "JSONInterface/JsonUpdateUserInfos.h"
#include "TestJsonUpdateUserInfos.h"
#include "lib/Profiler.h"

#include "rapidjson/pointer.h"

using namespace rapidjson;

void TestJsonUpdateUserInfos::SetUp()
{
	auto sm = SessionManager::getInstance();
	//sm->init();	
	mUserSession = sm->getNewSession();
	auto user = controller::User::create();
	user->load("Jeet_bb@gmail.com");
	mUserSession->setUser(user);
}

void TestJsonUpdateUserInfos::TearDown()
{
	auto sm = SessionManager::getInstance();
	if (!mUserSession) {
		sm->releaseSession(mUserSession);
	}
}

Document TestJsonUpdateUserInfos::chooseAccount(Value& update)
{
	Document params(kObjectType);
	auto alloc = params.GetAllocator();
	auto email = mUserSession->getNewUser()->getModel()->getEmail();
	params.AddMember("email", Value(email.data(), alloc), alloc);
	params.AddMember("update", update, alloc);
	return params;
}


TEST_F(TestJsonUpdateUserInfos, EmptyOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Value update(kObjectType);	
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password", "haLL1o_/%s", alloc);

	
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 300);

	Value& first_error = Pointer("/errors/0").GetWithDefault(params, "");
	ASSERT_TRUE(first_error.IsString());
	ASSERT_EQ(std::string(first_error.GetString(), first_error.GetStringLength()), "User.password_old not found");

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);

	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "error");
}

TEST_F(TestJsonUpdateUserInfos, OnlyOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);

	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password_old", "TestP4ssword&H", alloc);

	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 200);

	auto errors_it = result.FindMember("errors");
	ASSERT_NE(errors_it, result.MemberEnd());
	ASSERT_TRUE(errors_it->value.IsArray());
	ASSERT_EQ(errors_it->value.Size(), 0);

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);
	
	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "success");
}

TEST_F(TestJsonUpdateUserInfos, WrongPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password", "newPassword", alloc);
	update.AddMember("User.password_old", "TestP4sswordH", alloc);

	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

		
	Value& first_error = Pointer("/errors/0").GetWithDefault(params, "");
	ASSERT_TRUE(first_error.IsString());
	ASSERT_EQ(std::string(first_error.GetString(), first_error.GetStringLength()), "User.password_old didn't match");

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);
	
	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "error");
}

TEST_F(TestJsonUpdateUserInfos, EmptyPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password", "", alloc);
	update.AddMember("User.password_old", "TestP4sswordH",alloc);
		
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 200);

	Value& first_error = Pointer("/errors/0").GetWithDefault(params, "");
	ASSERT_TRUE(first_error.IsString());
	ASSERT_EQ(std::string(first_error.GetString(), first_error.GetStringLength()), "User.password is empty");

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);

	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "error");
}

TEST_F(TestJsonUpdateUserInfos, NewPasswordSameAsOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password", "TestP4ssword&H", alloc);
	update.AddMember("User.password_old", "TestP4ssword&H", alloc);
	
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors_it = result.FindMember("errors");
	ASSERT_NE(errors_it, result.MemberEnd());
	ASSERT_TRUE(errors_it->value.IsArray());
	ASSERT_EQ(errors_it->value.Size(), 0);

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);

	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "success");
}

TEST_F(TestJsonUpdateUserInfos, PasswordNotSecureEnough)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.password", "newPassword", alloc);
	update.AddMember("User.password_old", "TestP4ssword&H", alloc);
	
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors_it = result.FindMember("errors");
	ASSERT_NE(errors_it, result.MemberEnd());
	ASSERT_TRUE(errors_it->value.IsArray());

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());

	std::string state;
	jsonCall.getStringParameter(params, "state", state);

	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) == ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) {
		EXPECT_EQ(valid_values, 1);
		ASSERT_EQ(errors_it->value.Size(), 0);
		ASSERT_EQ(state, "success");
	}
	else {
		EXPECT_EQ(valid_values, 0);

		ASSERT_EQ(errors_it->value.Size(), 2);
		std::string first_error(errors_it->value.Begin()->GetString(), errors_it->value.Begin()->GetStringLength());
		ASSERT_EQ(first_error, "User.password isn't valid");

		ASSERT_EQ(state, "error");
	}

}


TEST_F(TestJsonUpdateUserInfos, PasswordCorrect)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	Value update(kObjectType);

	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();

	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) == ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) {
		ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "newPassword"), USER_COMPLETE);
		update.AddMember("User.password_old", "newPassword", alloc);
	}
	else {
		ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);
		update.AddMember("User.password_old", "TestP4ssword&H", alloc);
	}	

	
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors_it = result.FindMember("errors");
	ASSERT_NE(errors_it, result.MemberEnd());
	ASSERT_TRUE(errors_it->value.IsArray());
	ASSERT_EQ(errors_it->value.Size(), 0);

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 1);

	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "success");
	
}
//*/
TEST_F(TestJsonUpdateUserInfos, NoChanges)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	
	Value update(kObjectType);
	auto params = chooseAccount(update);
	auto alloc = params.GetAllocator();
	update.AddMember("User.first_name", "Darios", alloc);
	update.AddMember("User.last_name", "Bruder", alloc);

	Profiler timeUsed;
	auto result = jsonCall.handle(params);

	auto errors_it = result.FindMember("errors");
	ASSERT_NE(errors_it, result.MemberEnd());
	ASSERT_TRUE(errors_it->value.IsArray());
	ASSERT_EQ(errors_it->value.Size(), 0);

	Value& valid_values = Pointer("/valid_values").GetWithDefault(params, 0);
	ASSERT_TRUE(valid_values.IsInt());
	ASSERT_EQ(valid_values.GetInt(), 0);

	std::string state;
	jsonCall.getStringParameter(params, "state", state);
	ASSERT_EQ(state, "success");

}