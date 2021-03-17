#ifndef __GRADIDO_LOGIN_SERVER_TEST_HASH_
#define __GRADIDO_LOGIN_SERVER_TEST_HASH_

#include "Test.h"

class TestHash : public Test
{
public:
	TestHash();
	~TestHash();
	//! \return 0 if init okay, else return != 0
	int init();

	//! \return 0 if okay, else return != 0
	int test();
	const char* getName() { return "TestHash"; };
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_HASH_