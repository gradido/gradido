#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_PENDING_TASKS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_PENDING_TASKS_INCLUDE

#include "ModelBase.h"
#include "Poco/Types.h"

#include <shared_mutex>

namespace model {
	namespace table {

		enum TaskType {
			TASK_TYPE_NONE = 0,
			TASK_TYPE_GROUP_CREATE = 1,
			TASK_TYPE_GROUP_ADD_MEMBER = 2,
			TASK_TYPE_CREATION = 10,
			TASK_TYPE_TRANSFER = 11

		};

		typedef Poco::Tuple<int, int, Poco::Data::BLOB, Poco::DateTime, Poco::DateTime, std::string, std::string, int, int, int> PendingTaskTuple;

		class PendingTask : public ModelBase
		{
		public:

			PendingTask();
			PendingTask(int userId, std::string serializedProtoRequest, TaskType type);
			PendingTask(const PendingTaskTuple& tuple);


			// generic db operations
			const char* getTableName() const { return "pending_tasks"; }
			std::string toString();

			//! \brief update table row with current request
			bool updateRequest();

			bool updateFinishedAndResult();
			bool updateParam();

			inline int getUserId() const { SHARED_LOCK; return mUserId; }
			inline const std::vector<unsigned char>& getRequest() const { SHARED_LOCK; return mRequest.content(); }
			inline std::string getRequestCopy() const { SHARED_LOCK; return std::string((const char*)mRequest.content().data(), mRequest.content().size()); }
			rapidjson::Document getResultJson() const;
			rapidjson::Document getParamJson() const;
			inline Poco::DateTime getCreated() const { SHARED_LOCK; return mCreated; }
			inline TaskType getTaskType() const { SHARED_LOCK; return (TaskType)mTaskTypeId; }
			inline const char* getTaskTypeString() const { SHARED_LOCK; return typeToString((TaskType)mTaskTypeId); }
			inline int getChildPendingTaskId() const { SHARED_LOCK; return mChildPendingTaskId; }
			inline int getParentPendingTaskId() const { SHARED_LOCK; return mParentPendingTaskId; }

			inline void setUserId(int userId) { UNIQUE_LOCK;  mUserId = userId; }
			void setRequest(const std::string& serializedProto);
			inline void setFinished(Poco::DateTime date) { UNIQUE_LOCK; mFinished = date; }
			void setResultJson(rapidjson::Document result);
			void setParamJson(rapidjson::Document param);
			inline void setTaskType(TaskType type) { UNIQUE_LOCK; mTaskTypeId = type; }
			inline void setChildPendingTaskId(int childPendingTaskId) {UNIQUE_LOCK; mChildPendingTaskId = childPendingTaskId;}
			inline void setParentPendingTaskId(int parentPendingTaskId) { UNIQUE_LOCK; mParentPendingTaskId = parentPendingTaskId; }

			inline bool isGradidoTransaction() { SHARED_LOCK; return isGradidoTransaction((TaskType)mTaskTypeId); }
			static bool isGradidoTransaction(TaskType type);

			static const char* typeToString(TaskType type);
		protected:
			~PendingTask();

			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadAllFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			Poco::Data::BLOB mRequest;
			Poco::DateTime mCreated;
			Poco::DateTime mFinished;
			std::string mResultJsonString;
			std::string mParamJsonString;
			int mTaskTypeId;
			int mChildPendingTaskId;
			int mParentPendingTaskId;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_PENDING_TASKS_INCLUDE
