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

Poco::JSON::Object::Ptr TestJsonUpdateUserInfos::chooseAccount(const Poco::JSON::Object::Ptr update)
{
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("email", mUserSession->getNewUser()->getModel()->getEmail());
	params->set("update", update);
	return params;
}


TEST_F(TestJsonUpdateUserInfos, EmptyOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;
	
	update->set("User.password", "haLL1o_/%s");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 300);

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

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, OnlyOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password_old", "TestP4ssword&H");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 200);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);
	ASSERT_EQ(valid_values, 0);
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	ASSERT_EQ(error_array.size(), 0);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, WrongPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "newPassword");
	update->set("User.password_old", "TestP4sswordH");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

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

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, EmptyPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "");
	update->set("User.password_old", "TestP4sswordH");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_LE(timeUsed.millis(), 200);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);
	ASSERT_EQ(valid_values, 0);
	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	ASSERT_EQ(error_array.size(), 1);
	ASSERT_EQ(error_array.getElement<std::string>(0), "User.password is empty");

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "error");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, NewPasswordSameAsOldPassword)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "TestP4ssword&H");
	update->set("User.password_old", "TestP4ssword&H");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);

	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());


	EXPECT_EQ(valid_values, 0);
	ASSERT_EQ(error_array.size(), 0);
	ASSERT_EQ(state.toString(), "success");

	delete result;
}

TEST_F(TestJsonUpdateUserInfos, PasswordNotSecureEnough)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "newPassword");
	update->set("User.password_old", "TestP4ssword&H");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);

	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());

	if ((ServerConfig::g_AllowUnsecureFlags & ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) == ServerConfig::UNSECURE_ALLOW_ALL_PASSWORDS) {
		EXPECT_EQ(valid_values, 1);
		ASSERT_EQ(error_array.size(), 0);
		ASSERT_EQ(state.toString(), "success");
	}
	else {
		EXPECT_EQ(valid_values, 0);

		ASSERT_EQ(error_array.size(), 2);
		ASSERT_EQ(error_array.getElement<std::string>(0), "User.password isn't valid");

		ASSERT_EQ(state.toString(), "error");
	}

	delete result;
}

/*
TEST_F(TestJsonUpdateUserInfos, PasswordCorrect)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	ASSERT_EQ(mUserSession->loadUser("Jeet_bb@gmail.com", "TestP4ssword&H"), USER_COMPLETE);

	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.password", "uasjUs7ZS/as12");
	update->set("User.password_old", "TestP4ssword&H");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	ASSERT_GE(timeUsed.millis(), ServerConfig::g_FakeLoginSleepTime * 0.75);

	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);

	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());

	
	EXPECT_EQ(valid_values, 1);
	ASSERT_EQ(error_array.size(), 0);
	ASSERT_EQ(state.toString(), "success");
	

	delete result;
}
*/
TEST_F(TestJsonUpdateUserInfos, NoChanges)
{
	JsonUpdateUserInfos jsonCall(mUserSession);
	
	Poco::JSON::Object::Ptr update = new Poco::JSON::Object;

	update->set("User.first_name", "Darios");
	update->set("User.last_name", "Bruder");

	auto params = chooseAccount(update);
	Profiler timeUsed;
	auto result = jsonCall.handle(params);
	
	auto errors = result->get("errors");
	ASSERT_TRUE(errors.isArray());
	auto valid_values_obj = result->get("valid_values");
	ASSERT_TRUE(valid_values_obj.isInteger());
	int valid_values = 0;
	valid_values_obj.convert(valid_values);

	Poco::JSON::Array error_array = errors.extract<Poco::JSON::Array>();
	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());


	EXPECT_EQ(valid_values, 0);
	ASSERT_EQ(error_array.size(), 0);
	ASSERT_EQ(state.toString(), "success");


	delete result;
}