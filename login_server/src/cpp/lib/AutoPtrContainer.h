#ifndef __GRADIDO_LOGIN_SERVER_LIB_AUTO_PTR_CONTAINER
#define __GRADIDO_LOGIN_SERVER_LIB_AUTO_PTR_CONTAINER

/*!
 * \author: Dario Rekowski
 *
 * \date: 02.06.2020
 *
 * \brief: keep track over reserved instances, for using with Poco::AutoPtr
*/

#include "Poco/Mutex.h"

class AutoPtrContainer
{
public:
	AutoPtrContainer();
	AutoPtrContainer(int referenceCount);



	void duplicate();
	void release();

protected:
	// called only from release
	virtual ~AutoPtrContainer();

private:
	
	int mReferenceCount;
	Poco::FastMutex mReferenceCountMutex;
};

#endif //__GRADIDO_LOGIN_SERVER_LIB_AUTO_PTR_CONTAINER