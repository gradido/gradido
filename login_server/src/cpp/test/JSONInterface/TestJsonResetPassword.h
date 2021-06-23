#ifndef __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_RESET_PASSWORD_H
#define __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_RESET_PASSWORD_H

#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/JSON/Object.h"

class TestJsonResetPassword : public ::testing::Test
{

protected:
	void SetUp() override;
	void TearDown() override;

	Session* mUserSession;

};

#endif //__GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_RESET_PASSWORD_H