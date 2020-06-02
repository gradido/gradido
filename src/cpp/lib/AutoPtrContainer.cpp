#include "AutoPtrContainer.h"

#include <assert.h>

AutoPtrContainer::AutoPtrContainer() : mReferenceCount(1) 
{
}

AutoPtrContainer::AutoPtrContainer(int referenceCount)
	: mReferenceCount(referenceCount) 
{
}

AutoPtrContainer::~AutoPtrContainer()
{
	mReferenceCount = 0;
}


void AutoPtrContainer::duplicate()
{
	Poco::ScopedLock<Poco::FastMutex> lock(mReferenceCountMutex);
	mReferenceCount++;
}

void AutoPtrContainer::release()
{
	Poco::ScopedLock<Poco::FastMutex> lock(mReferenceCountMutex);

	mReferenceCount--;
	assert(mReferenceCount >= 0);
	if (0 == mReferenceCount) {
		delete this;
	}
}