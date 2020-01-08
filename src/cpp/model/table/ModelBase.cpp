#include "ModelBase.h"
#include "sodium.h"

#include "../../ServerConfig.h"

#include "../../SingletonManager/ConnectionManager.h"

#include "Poco/URI.h"

namespace model {
	namespace table {

		ModelInsertTask::ModelInsertTask(Poco::AutoPtr<ModelBase> model, bool emailErrors /* = false */)
			: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mModel(model), mEmailErrors(emailErrors)
		{
#ifdef _UNI_LIB_DEBUG
			setName(model->getTableName());
#endif
		}


		int ModelInsertTask::run()
		{
			auto result = mModel->insertIntoDB();
			if (mModel->errorCount() > 0 && mEmailErrors) {
				mModel->sendErrorsAsEmail();
			}
			return !result;
			//return 0;
		}

		// ---------------------------------------------------------------------------------------------------

		ModelBase::~ModelBase()
		{
			lock("~ModelBase");
			assert(0 == mReferenceCount);
			unlock();
		}

		bool ModelBase::insertIntoDB()
		{
			printf("ModelBase::insertIntoDB with table: %s\n", getTableName());
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement insert = _insertIntoDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

			size_t resultCount = 0;
			try {
				
				return insert.execute() == 1;
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by insert", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: ", toString().data()));
				unlock();
			}
			//printf("data valid: %s\n", toString().data());
			return false;
		}

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

		Poco::Data::Statement ModelBase::_loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			std::string message = getTableName();
			message += "::_loadFromDB with multiple fields not implemented";
			throw Poco::Exception(message);
		}

		Poco::Data::Statement ModelBase::_loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			std::string message = getTableName();
			message += "::_loadMultipleFromDB not implemented";
			throw Poco::Exception(message);
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
				return Poco::DateTime(Poco::Timestamp(rawTime * 1000000));
			}

			return Poco::DateTime(Poco::Timestamp());
		}
	}
}
