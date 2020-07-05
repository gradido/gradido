#ifndef GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE

#include "Poco/Data/Session.h"

#include "../../SingletonManager/ConnectionManager.h"
#include "../../lib/MultithreadContainer.h"
#include "../../tasks/CPUTask.h"

//#include "../../MySQL/MysqlTable.h"

#include "../../ServerConfig.h"

#include "Poco/JSON/Object.h"

#include <shared_mutex>
//using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		enum MysqlConditionType {
			MYSQL_CONDITION_AND,
			MYSQL_CONDITION_OR 
		};

		class ModelBase : public UniLib::lib::MultithreadContainer, public ErrorList
		{
		public:
			ModelBase(int id) :mID(id), mReferenceCount(1) {}
			ModelBase() : mID(0), mReferenceCount(1) {}
			virtual ~ModelBase();

			virtual const char* getTableName() const = 0;
			virtual std::string toString() = 0;
			
			template<class T> 
			size_t updateIntoDB(const std::string& fieldName, const T& fieldValue );
			template<class T> 
			size_t loadFromDB(const std::string& fieldName, const T& fieldValue);
			template<class T>
			bool isExistInDB(const std::string& fieldName, const T& fieldValue);
			template<class WhereFieldType, class Tuple> 
			std::vector<Tuple> loadFromDB(const std::string& fieldName, const WhereFieldType& fieldValue, int expectedResults = 0);
			template<class T1, class T2> 
			size_t loadFromDB(const std::vector<std::string>& fieldNames, const T1& field1Value, const T2& field2Value, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			template<class WhereFieldType, class Tuple>
			std::vector<Tuple> loadFromDB(const std::vector<std::string>& fieldNames, const std::vector<WhereFieldType>& fieldValues, MysqlConditionType conditionType = MYSQL_CONDITION_AND, int expectedResults = 0);
			bool insertIntoDB(bool loadId);

			bool deleteFromDB();

			inline void setID(int id) { lock(); mID = id; unlock(); }
			inline int getID() { lock(); int id = mID; unlock(); return id; }

			static Poco::DateTime parseElopageDate(std::string dateString);

			// for poco auto ptr
			void duplicate();
			void release();
		protected:
			virtual Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session) = 0;
			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName) = 0;
			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			virtual Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			virtual Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			virtual Poco::Data::Statement _insertIntoDB(Poco::Data::Session session) = 0;

			int mID;

			// for poco auto ptr
			int mReferenceCount;			

		};

		template<class T>
		size_t ModelBase::loadFromDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			Poco::Data::Statement select = _loadFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldName);
			select, Poco::Data::Keywords::useRef(fieldValue);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by selecting", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
			}
			return resultCount;
		}

		template<class T>
		bool ModelBase::isExistInDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select(session);
			int id;
			select << "SELECT " << "id "
				<< " FROM " << getTableName()
				<< " WHERE " << fieldName << " = ?"
				, Poco::Data::Keywords::into(id), Poco::Data::Keywords::useRef(fieldValue);
			try {
				if (select.execute() == 1) {
					return true;
				}
			}
			catch (Poco::Exception& ex) {
				/*lock();
				addError(new ParamError(getTableName(), "mysql error by isExistInDB", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();*/
			}
			return false;
		}

		template<class WhereFieldType, class Tuple> 
		std::vector<Tuple> ModelBase::loadFromDB(const std::string& fieldName, const WhereFieldType& fieldValue, int expectedResults)
		{
			//printf("ModelBase::loadFromDB multi\n");
			std::vector<Tuple> results;
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			//return results;
			if (expectedResults > 0) {
				results.reserve(expectedResults);
			}
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement select = _loadMultipleFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldName);
			select, Poco::Data::Keywords::into(results), Poco::Data::Keywords::useRef(fieldValue);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by multi selecting", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return results;
		}

		template<class WhereFieldType, class Tuple>
		std::vector<Tuple> ModelBase::loadFromDB(const std::vector<std::string>& fieldNames, const std::vector<WhereFieldType>& fieldValues, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/, int expectedResults/* = 0*/)
		{
			std::vector<Tuple> results;
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			if (fieldNames.size() != fieldValues.size() || fieldNames.size() <= 1) {
				lock();
				addError(new Error(getTableName(), "fieldNames and fieldValues size don't match or smaller as 1"));
				unlock();
				return results;
			}
			if (expectedResults > 0) {
				results.reserve(expectedResults);
			}
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement select = _loadMultipleFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldNames, conditionType);
			select, Poco::Data::Keywords::into(results);// Poco::Data::Keywords::useRef(fieldValue);
			for (auto it = fieldValues.begin(); it != fieldValues.end(); it++) {
				select, Poco::Data::Keywords::useRef(*it);
			}

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by multi selecting", ex.displayText().data()));
				for (auto it = fieldNames.begin(); it != fieldNames.end(); it++) {
					addError(new ParamError(getTableName(), "field name for select: ", (*it).data()));
				}
				unlock();
			}
			return results;
		}

		template<class T1, class T2> 
		size_t ModelBase::loadFromDB(const std::vector<std::string>& fieldNames, const T1& field1Value, const T2& field2Value, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			Poco::Data::Statement select = _loadFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldNames, conditionType);
			select, Poco::Data::Keywords::useRef(field1Value), Poco::Data::Keywords::useRef(field2Value);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by selecting", ex.displayText()));
				for (auto it = fieldNames.begin(); it != fieldNames.end(); it++) {
					addError(new ParamError(getTableName(), "field name for select: ", *it));
				}
				//addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return resultCount;
		}


		template<class T>
		size_t ModelBase::updateIntoDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement update(session);

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET " << fieldName << " = ? where id = ?",
				Poco::Data::Keywords::useRef(fieldValue), Poco::Data::Keywords::use(mID);

			size_t resultCount = 0;
			try {
				resultCount = update.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for update: ", fieldName.data()));
				unlock();
			}
			return resultCount;
	
		}

		// ******************** Generic Tasks ************************************


		// --------       Insert      ---------------
		class ModelInsertTask : public UniLib::controller::CPUTask
		{
		public:
			ModelInsertTask(Poco::AutoPtr<ModelBase> model, bool loadId, bool emailErrors = false);

			int run();
			const char* getResourceType() const { return "ModelInsertTask"; };

		protected:
			Poco::AutoPtr<ModelBase> mModel;
			bool mEmailErrors;
			bool mLoadId;

		};
		// --------       Update      ---------------

		template <class T>
		class ModelUpdateTask : public UniLib::controller::CPUTask
		{
		public:
			ModelUpdateTask(Poco::AutoPtr<ModelBase> model, const std::string& fieldName, const T& fieldValue, bool emailErrors = false)
				: UniLib::controller::CPUTask(ServerConfig::g_CPUScheduler), mModel(model), mFieldName(fieldName), mFieldValue(fieldValue), mEmailErrors(emailErrors)
			{
#ifdef _UNI_LIB_DEBUG
				setName(model->getTableName());
#endif
			}

			int run() {
				auto result = mModel->updateIntoDB(mFieldName, mFieldValue);
				if (mModel->errorCount() > 0 && mEmailErrors) {
					mModel->sendErrorsAsEmail();
				}
				return !(result > 0);
			}
			const char* getResourceType() const { return "ModelUpdateTask"; };

		protected:
			Poco::AutoPtr<ModelBase> mModel;
			std::string mFieldName;
			T mFieldValue;
			bool mEmailErrors;
		};

		// --------       Load      ---------------

	}
}




#endif //GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE