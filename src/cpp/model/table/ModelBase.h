#ifndef GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE

#include "Poco/Data/Session.h"

#include "../../SingletonManager/ConnectionManager.h"
#include "../../lib/MultithreadContainer.h"
#include "../../tasks/CPUTask.h"

#include "../../MySQL/MysqlTable.h"

namespace model {
	namespace table {

		class ModelBase : public UniLib::lib::MultithreadContainer, public ErrorList
		{
		public:
			ModelBase(int id) :mID(id), mReferenceCount(1) {}
			ModelBase() : mID(0), mReferenceCount(1) {}
			virtual ~ModelBase();

			virtual const char* getTableName() = 0;
			
			template<class T> size_t updateIntoDB(const std::string& fieldName, T fieldValue );
			template<class T> size_t loadFromDB(const std::string& fieldName, T fieldValue);
			bool insertIntoDB();

			inline void setID(int id) { lock(); mID = id; unlock(); }
			inline int getID() { lock(); int id = mID; unlock(); return id; }

			static Poco::DateTime parseElopageDate(std::string dateString);

			// for poco auto ptr
			void duplicate();
			void release();
		protected:

			virtual Poco::Data::Statement _loadFromDB(Poco::Data::Session session, std::string& fieldName) = 0;
			virtual Poco::Data::Statement _insertIntoDB(Poco::Data::Session session) = 0;

			int mID;

			// for poco auto ptr
			int mReferenceCount;

		};

		template<class T>
		size_t ModelBase::loadFromDB(const std::string& fieldName, T fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement select = _loadFromDB(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER), fieldName);
			select, use(fieldValue);

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
		size_t ModelBase::updateIntoDB(const std::string& fieldName, T fieldValue)
		{
			auto cm = ConnectionManager::getInstance();
			Poco::Data::Statement update(cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER));

			if (mID == 0) {
				addError(new Error("ModelBase::updateIntoDB", "id is zero"));
				return 0;
			}

			update << "UPDATE " << getTableName() << " SET " << fieldName << " = ? where id = ?",
					   use(fieldValue), use(mID);

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
			ModelInsertTask(Poco::AutoPtr<ModelBase> model);

			int run();
			const char* getResourceType() const { return "ModelInsertTask"; };

		protected:
			Poco::AutoPtr<ModelBase> mModel;

		};
	}
}




#endif //GRADIDO_LOGIN_SERVER_MODEL_INTERFACE_INCLUDE