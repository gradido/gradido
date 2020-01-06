#ifndef GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE

#include "Poco/Data/Session.h"

#include "../../SingletonManager/ConnectionManager.h"
#include "../../lib/MultithreadContainer.h"
#include "../../tasks/CPUTask.h"

#include "../../MySQL/MysqlTable.h"

//using namespace Poco::Data::Keywords;

namespace model {
	namespace table {

		class ModelBase : public UniLib::lib::MultithreadContainer, public ErrorList
		{
		public:
			ModelBase(int id) :mID(id), mReferenceCount(1) {}
			ModelBase() : mID(0), mReferenceCount(1) {}
			virtual ~ModelBase();

			virtual const char* getTableName() = 0;
			virtual std::string toString() = 0;
			
			template<class T> size_t updateIntoDB(const std::string& fieldName, const T& fieldValue );
			template<class T> size_t loadFromDB(const std::string& fieldName, const T& fieldValue);
			bool insertIntoDB();

			inline void setID(int id) { lock(); mID = id; unlock(); }
			inline int getID() { lock(); int id = mID; unlock(); return id; }

			static Poco::DateTime parseElopageDate(std::string dateString);

			// for poco auto ptr
			void duplicate();
			void release();
		protected:

			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName) = 0;
			virtual Poco::Data::Statement _insertIntoDB(Poco::Data::Session session) = 0;

			int mID;

			// for poco auto ptr
			int mReferenceCount;

		};

		template<class T>
		size_t ModelBase::loadFromDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement select = _loadFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldName);
			select, Poco::Data::Keywords::useRef(fieldValue);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
			}
			catch (Poco::Exception& ex) {
				lock();
				addError(new ParamError(getTableName(), "mysql error by selecting", ex.displayText().data()));
				addError(new ParamError(getTableName(), "field name for select: ", fieldName.data()));
				unlock();
			}
			return resultCount;
		}

		template<class T>
		size_t ModelBase::updateIntoDB(const std::string& fieldName, const T& fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement update(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET " << fieldName << " = ? where id = ?",
				Poco::Data::Keywords::useRef(fieldValue), Poco::Data::Keywords::use(mID);

			size_t resultCount = 0;
			try {
				resultCount = select.execute();
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

		class ModelInsertTask : public UniLib::controller::CPUTask
		{
		public:
			ModelInsertTask(Poco::AutoPtr<ModelBase> model, bool emailErrors = false);

			int run();
			const char* getResourceType() const { return "ModelInsertTask"; };

		protected:
			Poco::AutoPtr<ModelBase> mModel;
			bool mEmailErrors;

		};


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


	}
}




#endif //GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE