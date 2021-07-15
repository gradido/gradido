#ifndef __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_CREATE_TRANSACTION_H
#define __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_CREATE_TRANSACTION_H

#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/JSON/Object.h"

class TestJsonCreateTransaction : public ::testing::Test
{

protected:
	void SetUp() override;
	void TearDown() override;

	Poco::JSON::Object::Ptr basisSetup();

	Session* mUserSession;
	std::string mEmail;

};

#endif //__GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_CREATE_TRANSACTION_H