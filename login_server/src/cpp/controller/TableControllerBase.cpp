#include "TableControllerBase.h"

#include <assert.h>

namespace controller {

	TableControllerBase::TableControllerBase()
		: mReferenceCount(1)
	{

	}


	TableControllerBase::~TableControllerBase()
	{
		lock("TableControllerBase::deconstruct");
		assert(0 == mReferenceCount);
		
		unlock();
	}

	void TableControllerBase::duplicate()
	{
		Poco::ScopedLock<Poco::FastMutex> _lock(mReferenceMutex);
		mReferenceCount++;		
	}

	void TableControllerBase::release()
	{
		Poco::ScopedLock<Poco::FastMutex> _lock(mReferenceMutex);
		mReferenceCount--;
		if (0 == mReferenceCount) {
			delete this;
			return;
		}
	}

}