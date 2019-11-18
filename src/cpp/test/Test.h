#ifndef __GRADIDO_LOGIN_SERVER_TEST_
#define __GRADIDO_LOGIN_SERVER_TEST_

class Test
{
public:
	//! \return 0 if init okay, else return != 0
	virtual int init() = 0;

	//! \return 0 if okay, else return != 0
	virtual int test() = 0;
	virtual const char* getName() = 0;
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_