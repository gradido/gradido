#ifndef __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_PACK_TRANSACTION_H
#define __GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_PACK_TRANSACTION_H

#include "gtest/gtest.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/JSON/Object.h"

class TestJsonPackTransaction : public ::testing::Test
{

protected:
	void SetUp() override;
	void TearDown() override;


};

#endif //__GRADIDO_LOGIN_SERVER_TEST_JSON_INTERFACE_TEST_JSON_PACK_TRANSACTION_H