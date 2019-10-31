#include "ModelBase.h"
#include "sodium.h"

#include "../ServerConfig.h"

#include "../SingletonManager/ConnectionManager.h"

#include "Poco/URI.h"

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

Poco::DateTime ModelBase::parseElopageDate(std::string dateString)
{
	std::string decodedDateString = "";
	Poco::URI::decode(dateString, decodedDateString);
	
	struct tm * parsedTime;
	// used because localtime return an internal pointer, not thread safe
	Poco::Mutex& timeMutex = ServerConfig::g_TimeMutex;

	int year, month, day, hour, minute, second;
	// ex: 2009-10-29 
	if (sscanf(decodedDateString.data(), "%d-%d-%dT%d:%dZ", &year, &month, &day, &hour, &minute) != EOF) {
		time_t rawTime;
		time(&rawTime);

		// static, used for every thread
		timeMutex.lock();
		parsedTime = localtime(&rawTime);

		// tm_year is years since 1900
		parsedTime->tm_year = year - 1900;
		// tm_months is months since january
		parsedTime->tm_mon = month - 1;
		parsedTime->tm_mday = day;
		parsedTime->tm_hour = hour;
		parsedTime->tm_min = minute;
		parsedTime->tm_sec = 0;

		rawTime = mktime(parsedTime);
		timeMutex.unlock();
		// rawTime is in seconds, poco timestamp in microseconds
		return Poco::DateTime(Poco::Timestamp(rawTime* 1000000));
	}
	
	return Poco::DateTime(Poco::Timestamp());
}