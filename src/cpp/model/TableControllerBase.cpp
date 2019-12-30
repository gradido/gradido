#include "TableControllerBase.h"

#include <assert.h>

namespace model {

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
		lock("TableControllerBase::duplicate");
		mReferenceCount++;
		//printf("[ModelBase::duplicate] new value: %d\n", mReferenceCount);
		unlock();
	}

	void TableControllerBase::release()
	{
		lock("TableControllerBase::release");
		mReferenceCount--;
		//printf("[ModelBase::release] new value: %d\n", mReferenceCount);
		if (0 == mReferenceCount) {
			unlock();
			delete this;
			return;
		}
		unlock();

	}

}