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
		std::string name = "TableControllerBase::duplicate";
		if (!mDBModel.isNull()) {
			name += ": ";
			name += mDBModel->getTableName();
		}
		lock(name.data());
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