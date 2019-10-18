#include "ModelBase.h"

#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"

ModelInsertTask::ModelInsertTask(Poco::AutoPtr<ModelBase> model)
	: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mModel(model) 
{
#ifdef _UNI_LIB_DEBUG
	setName(model->getTableName());
#endif
}

int ModelInsertTask::run()
{
	auto session = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	auto insert = mModel->insertIntoDB(session);

	try {
		insert.execute();
	}
	catch (Poco::Exception& ex) {
		mModel->lock();
		mModel->addError(new ParamError(mModel->getTableName(), "mysql error by inserting", ex.displayText().data()));
		mModel->unlock();
	}
	return 0;
}

// ---------------------------------------------------------------------------------------------------

void ModelBase::duplicate()
{
	lock();
	mReferenceCount++;
	//printf("[ModelBase::duplicate] new value: %d\n", mReferenceCount);
	unlock();
}

void ModelBase::release()
{
	lock();
	mReferenceCount--;
	//printf("[ModelBase::release] new value: %d\n", mReferenceCount);
	if (0 == mReferenceCount) {
		unlock();
		delete this;
		return;
	}
	unlock();

}