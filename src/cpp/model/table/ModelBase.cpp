#include "ModelBase.h"
#include "sodium.h"

#include "../../ServerConfig.h"

#include "../../SingletonManager/ConnectionManager.h"

#include "Poco/URI.h"

namespace model {
	namespace table {

		ModelInsertTask::ModelInsertTask(Poco::AutoPtr<ModelBase> model, bool loadId, bool emailErrors /* = false */)
			: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mModel(model), mEmailErrors(emailErrors), mLoadId(loadId)
		{
#ifdef _UNI_LIB_DEBUG
			setName(model->getTableName());
#endif
		}


		int ModelInsertTask::run()
		{
			auto result = mModel->insertIntoDB(mLoadId);
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

		bool ModelBase::insertIntoDB(bool loadId)
		{
			//printf("ModelBase::insertIntoDB with table: %s\n", getTableName());
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			Poco::Data::Statement insert = _insertIntoDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

			size_t resultCount = 0;
			try {
				if (insert.execute() == 1) {
					// load id from db
					if (loadId) {
						Poco::Data::Statement select = _loadIdFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));
						try {
							return select.execute() == 1;
						}
						catch (Poco::Exception& ex) {							
							addError(new ParamError(getTableName(), "mysql error by select id", ex.displayText().data()));
							addError(new ParamError(getTableName(), "data set: ", toString().data()));
						}
					}
					else {
						return true;
					}
				}
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by insert", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: ", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return false;
		}

		bool ModelBase::deleteFromDB()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (mID == 0) {
				addError(new Error(getTableName(), "id is zero, couldn't delete from db"));
				return false;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement deleteStmt(session);
			deleteStmt << "delete from " << getTableName() << " where id = ?", Poco::Data::Keywords::use(mID);

			try {
				return deleteStmt.execute() == 1;
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by delete", ex.displayText().data()));
				addError(new ParamError(getTableName(), "id: ", mID));
				unlock();
			}
			return false;
		}

		void ModelBase::duplicate()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			mReferenceCount++;
			//printf("[ModelBase::duplicate] new value: %d\n", mReferenceCount);
		}

		void ModelBase::release()
		{
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			mReferenceCount--;
			//printf("[ModelBase::release] new value: %d\n", mReferenceCount);
			if (0 == mReferenceCount) {
				
				delete this;
				return;
			}

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

		Poco::Data::Statement ModelBase::_loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			std::string message = getTableName();
			message += "::_loadMultipleFromDB multi not implemented";
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
