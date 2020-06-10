#ifndef __GRADIDO_LOGIN_SERVER_TEST_CONTROLLER_USER_H
#define __GRADIDO_LOGIN_SERVER_TEST_CONTROLLER_USER_H


#include "gtest/gtest.h"

namespace controller {

	class TestUser : public ::testing::Test {
	protected:
		void SetUp() override;
	};
}


#endif //__GRADIDO_LOGIN_SERVER_TEST_CONTROLLER_USER_H