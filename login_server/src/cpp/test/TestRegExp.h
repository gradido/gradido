#ifndef __GRADIDO_LOGIN_SERVER_TEST_REG_EXP_
#define __GRADIDO_LOGIN_SERVER_TEST_REG_EXP_

#include "Test.h"

class TestRegExp : public Test
{
public:
	TestRegExp();
	~TestRegExp();
	//! \return 0 if init okay, else return != 0
	int init();

	//! \return 0 if okay, else return != 0
	int test();
	const char* getName() { return "TestRegExp"; };
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_REG_EXP_