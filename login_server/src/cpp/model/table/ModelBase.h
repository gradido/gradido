#ifndef GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE

#include "Poco/Data/Session.h"

#include "../../SingletonManager/ConnectionManager.h"
#include "../../lib/MultithreadContainer.h"
#include "../../tasks/CPUTask.h"

//#include "../../MySQL/MysqlTable.h"

#include "../../ServerConfig.h"

#include <shared_mutex>
//using namespace Poco::Data::Keywords;

#define SHARED_LOCK std::shared_lock<std::shared_mutex> _lock(mSharedMutex)
#define UNIQUE_LOCK std::unique_lock<std::shared_mutex> _lock(mSharedMutex)

namespace model {
	namespace table {

		enum MysqlConditionType {
			MYSQL_CONDITION_AND,
			MYSQL_CONDITION_OR 
		};

		class ModelBase : public UniLib::lib::MultithreadContainer, public NotificationList
		{
		public:
			ModelBase(int id) :mID(id), mReferenceCount(1) {}
			ModelBase() : mID(0), mReferenceCount(1) {}
			

			virtual const char* getTableName() const = 0;
			//! called from within of some catch to give more information for debugging, don't lock mutex!
			virtual std::string toString() = 0;
			
			template<class T> 
			size_t updateIntoDB(const std::string& fieldName, const T& fieldValue );
			template<class T1, class T2>
			size_t updateIntoDB(std::string fieldNames[2], const T1& fieldValue1, const T2& fieldValue2);
			template<class T1, class T2, class T3>
			size_t updateIntoDB(std::string fieldNames[3], const T1& fieldValue1, const T2& fieldValue2, const T3& fieldValue3);
			template<class T1, class T2, class T3, class T4>
			size_t updateIntoDB(std::string fieldNames[4], const T1& fieldValue1, const T2& fieldValue2, const T3& fieldValue3, const T4& fieldValue4);
			template<class T> 
			size_t loadFromDB(const std::string& fieldName, const T& fieldValue);
			//! \brief count columes for "SELECT count(id) from <tableName> where <fieldName> = <fieldValue> group by id";
			template<class T>
			size_t countColumns(const std::string& fieldName, const T& fieldValue);
			template<class T>
			bool isExistInDB(const std::string& fieldName, const T& fieldValue);
			bool isExistInDB();
			template<class WhereFieldType, class Tuple> 
			std::vector<Tuple> loadFromDB(const std::string& fieldName, const WhereFieldType& fieldValue, int expectedResults = 0);
			template<class Tuple>
			std::vector<Tuple> loadAllFromDB();
			template<class T1, class T2> 
			size_t loadFromDB(const std::vector<std::string>& fieldNames, const T1& field1Value, const T2& field2Value, MysqlConditionType conditionType = MYSQL_CONDITION_AND);

			template<class Tuple, class T1, class T2>
			std::vector<Tuple> loadMultipleFromDB(
				const std::vector<std::string>& fieldNames,
				const T1& field1Value, const T2& field2Value,
				MysqlConditionType conditionType = MYSQL_CONDITION_AND);

			template<class Tuple, class T1, class T2, class T3, class T4>
			std::vector<Tuple> loadMultipleFromDB(
				const std::vector<std::string>& fieldNames,
				const T1& field1Value, const T2& field2Value, const T3& field3Value, const T4& field4Value,
				MysqlConditionType conditionType = MYSQL_CONDITION_AND);

			template<class WhereFieldType, class Tuple>
			std::vector<Tuple> loadFromDB(const std::vector<std::string>& fieldNames, const std::vector<WhereFieldType>& fieldValues, MysqlConditionType conditionType = MYSQL_CONDITION_AND, int expectedResults = 0);
			bool insertIntoDB(bool loadId);

			bool deleteFromDB();

			inline void setID(int id) { UNIQUE_LOCK; mID = id; }
			inline int getID() const { SHARED_LOCK; return mID; }

			static Poco::DateTime parseElopageDate(std::string dateString);

			static std::string secondsToReadableDuration(Poco::UInt64 seconds);

			// for poco auto ptr
			void duplicate();
			void release();
		protected:
			virtual ~ModelBase();

			virtual Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session) = 0;
			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName) = 0;
			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::vector<std::string>& fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			virtual Poco::Data::Statement _loadAllFromDB(Poco::Data::Session session);
			virtual Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			virtual Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::vector<std::string> fieldNames, MysqlConditionType conditionType = MYSQL_CONDITION_AND);
			virtual Poco::Data::Statement _insertIntoDB(Poco::Data::Session session) = 0;

			int mID;

			// for poco auto ptr
			int mReferenceCount;	

			mutable std::shared_mutex mSharedMutex;

		private:
			

		};

		template<class T>
		size_t ModelBase::loadFromDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadFromDB(session, fieldName);
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
		size_t ModelBase::countColumns(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			//Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select(session);
			size_t count = 0;
			select
				<< "SELECT count(id) from " << getTableName()
				<< " where " << fieldName << " LIKE ? group by " << fieldName
				,Poco::Data::Keywords::into(count)
				,Poco::Data::Keywords::useRef(fieldValue);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by selecting", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
			}
			return count;
		}

		template<class T>
		bool ModelBase::isExistInDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			//Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select(session);
			int id;
			select << "SELECT " << "count(*) as id"
				<< " FROM " << getTableName()
				<< " WHERE " << fieldName << " = ?"
				, Poco::Data::Keywords::into(id), Poco::Data::Keywords::useRef(fieldValue);
			try {
				select.execute();
				return id != 0;
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by isExistInDB", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return false;
		}

		template<class WhereFieldType, class Tuple> 
		std::vector<Tuple> ModelBase::loadFromDB(const std::string& fieldName, const WhereFieldType& fieldValue, int expectedResults)
		{
			//printf("ModelBase::loadFromDB multi\n");
			std::vector<Tuple> results;
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			//return results;
			if (expectedResults > 0) {
				results.reserve(expectedResults);
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadMultipleFromDB(session, fieldName);
			select, Poco::Data::Keywords::into(results), Poco::Data::Keywords::useRef(fieldValue);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock("ModelBase::loadFromDB");
				addError(new ParamError(getTableName(), "mysql error by multi selecting", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return results;
		}

		template<class Tuple>
		std::vector<Tuple> ModelBase::loadAllFromDB()
		{
			std::vector<Tuple> results;
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto cm = ConnectionManager::getInstance();
			try {							   
				auto connection = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
				Poco::Data::Statement select = _loadAllFromDB(connection);
				select, Poco::Data::Keywords::into(results);

				size_t resultCount = 0;
				try {
					resultCount = select.execute();
				}
				catch (Poco::Exception& ex) {
					addError(new ParamError(getTableName(), "mysql error by selecting all", ex.displayText().data()));
				}

				return results;
			}
			catch (Poco::Exception& ex) {
				addError(new Error(getTableName(), "loadAllFromDB not implemented!"));
				return results;
			}
		}

		template<class WhereFieldType, class Tuple>
		std::vector<Tuple> ModelBase::loadFromDB(const std::vector<std::string>& fieldNames, const std::vector<WhereFieldType>& fieldValues, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/, int expectedResults/* = 0*/)
		{
			std::vector<Tuple> results;
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			if (fieldNames.size() != fieldValues.size() || fieldNames.size() <= 1) {
				addError(new Error(getTableName(), "fieldNames and fieldValues size don't match or smaller as 1"));
				return results;
			}
			if (expectedResults > 0) {
				results.reserve(expectedResults);
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadMultipleFromDB(session, fieldNames, conditionType);
			select, Poco::Data::Keywords::into(results);// Poco::Data::Keywords::useRef(fieldValue);
			for (auto it = fieldValues.begin(); it != fieldValues.end(); it++) {
				select, Poco::Data::Keywords::useRef(*it);
			}

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by multi selecting", ex.displayText().data()));
				for (auto it = fieldNames.begin(); it != fieldNames.end(); it++) {
					addError(new ParamError(getTableName(), "field name for select: ", (*it).data()));
				}
			}
			return results;
		}

		template<class T1, class T2> 
		size_t ModelBase::loadFromDB(const std::vector<std::string>& fieldNames, const T1& field1Value, const T2& field2Value, MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadFromDB(session, fieldNames, conditionType);
			select, Poco::Data::Keywords::useRef(field1Value), Poco::Data::Keywords::useRef(field2Value);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by selecting, maybe more than one result?", ex.displayText()));
				int count = 0;
				for (auto it = fieldNames.begin(); it != fieldNames.end(); it++) {
					addError(new ParamError(getTableName(), "field name for select: ", *it));
				}
				
				//addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
			}
			return resultCount;
		}

		template<class Tuple, class T1, class T2>
		std::vector<Tuple> ModelBase::loadMultipleFromDB(
			const std::vector<std::string>& fieldNames,
			const T1& field1Value, const T2& field2Value,
			MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			auto cm = ConnectionManager::getInstance();
			std::vector<Tuple> results;
			if (fieldNames.size() != 2) {
				addError(new Error(getTableName(), "error in loadFromDB with 2 different field values, fieldNames count isn't 2"));
				return results;
			}
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadMultipleFromDB(session, fieldNames, conditionType);
			select, Poco::Data::Keywords::into(results),
				Poco::Data::Keywords::useRef(field1Value), Poco::Data::Keywords::useRef(field2Value);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by selecting with 2 different field types", ex.displayText()));
				int count = 0;
				for (auto it = fieldNames.begin(); it != fieldNames.end(); it++) {
					addError(new ParamError(getTableName(), "field name for select: ", *it));
				}

				//addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return results;
		}

		template<class Tuple, class T1, class T2, class T3, class T4>
		std::vector<Tuple> ModelBase::loadMultipleFromDB(
			const std::vector<std::string>& fieldNames, 
			const T1& field1Value, const T2& field2Value, const T3& field3Value, const T4& field4Value,
			MysqlConditionType conditionType/* = MYSQL_CONDITION_AND*/)
		{
			auto cm = ConnectionManager::getInstance();
			std::vector<Tuple> results;
			if (fieldNames.size() != 4) {
				addError(new Error(getTableName(), "error in loadFromDB with 4 different field values, fieldNames count isn't 4"));
				return results;
			}
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement select = _loadMultipleFromDB(session, fieldNames, conditionType);
			select, Poco::Data::Keywords::into(results),
				Poco::Data::Keywords::useRef(field1Value), Poco::Data::Keywords::useRef(field2Value),
				Poco::Data::Keywords::useRef(field3Value), Poco::Data::Keywords::useRef(field4Value);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by selecting with 4 different field types", ex.displayText()));
				int count = 0;
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
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement update(session);

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET " << fieldName << " = ? where id = ?",
				Poco::Data::Keywords::bind(fieldValue), Poco::Data::Keywords::bind(mID);

			size_t resultCount = 0;
			try {
				resultCount = update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for update: ", fieldName.data()));
				
			}
			return resultCount;
	
		}
		template<class T1, class T2>
		size_t ModelBase::updateIntoDB(std::string fieldNames[2], const T1& fieldValue1, const T2& fieldValue2)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement update(session);

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET ";
			for (int i = 0; i < 2; i++) {
				if (i) update << ", ";
				update << fieldNames[i] << " = ? ";
			}
			update << "WHERE id = ?"
			, Poco::Data::Keywords::bind(fieldValue1), Poco::Data::Keywords::bind(fieldValue2)
			, Poco::Data::Keywords::bind(mID);


			size_t resultCount = 0;
			try {
				resultCount = update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by update 2", ex.displayText()));
				for (int i = 0; i < 2; i++) {
					addError(new ParamError(getTableName(), "field name for update: ", fieldNames[i]));
				}
			}
			return resultCount;
		}
		template<class T1, class T2, class T3>
		size_t ModelBase::updateIntoDB(std::string fieldNames[3], const T1& fieldValue1, const T2& fieldValue2, const T3& fieldValue3)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement update(session);

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET ";
			for (int i = 0; i < 3; i++) {
				if (i) update << ", ";
				update << fieldNames[i] << " = ? ";
			}
			update << "WHERE id = ?"
				, Poco::Data::Keywords::bind(fieldValue1), Poco::Data::Keywords::bind(fieldValue2), Poco::Data::Keywords::bind(fieldValue3)
				, Poco::Data::Keywords::bind(mID);


			size_t resultCount = 0;
			try {
				resultCount = update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by update 3", ex.displayText()));
				for (int i = 0; i < 3; i++) {
					addError(new ParamError(getTableName(), "field name for update: ", fieldNames[i]));
				}

			}
			return resultCount;
		}

		template<class T1, class T2, class T3, class T4>
		size_t ModelBase::updateIntoDB(std::string fieldNames[4], const T1& fieldValue1, const T2& fieldValue2, const T3& fieldValue3, const T4& fieldValue4)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			UNIQUE_LOCK;
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
			Poco::Data::Statement update(session);

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET ";
			for (int i = 0; i < 4; i++) {
				if (i) update << ", ";
				update << fieldNames[i] << " = ? ";
			}
			update << "WHERE id = ?"
				, Poco::Data::Keywords::bind(fieldValue1), Poco::Data::Keywords::bind(fieldValue2)
				, Poco::Data::Keywords::bind(fieldValue3), Poco::Data::Keywords::bind(fieldValue4)
				, Poco::Data::Keywords::bind(mID);


			size_t resultCount = 0;
			try {
				resultCount = update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "mysql error by update 4", ex.displayText()));
				for (int i = 0; i < 3; i++) {
					addError(new ParamError(getTableName(), "field name for update: ", fieldNames[i]));
				}

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