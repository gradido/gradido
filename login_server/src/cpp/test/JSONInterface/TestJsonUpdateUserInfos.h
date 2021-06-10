#ifndef __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_UPDATE_USER_INFOS_H
#define __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_UPDATE_USER_INFOS_H

#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/JSON/Object.h"

class TestJsonUpdateUserInfos : public ::testing::Test
{

protected:
	void SetUp() override;
	void TearDown() override;

	Poco::JSON::Object::Ptr chooseAccount(const Poco::JSON::Object::Ptr update);

	Session* mUserSession;
	std::string mEmail;

};

#endif //__GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_UPDATE_USER_INFOS_H