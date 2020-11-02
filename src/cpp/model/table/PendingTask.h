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
			TASK_TYPE_TRANSFER = 11,
			TASK_TYPE_HEDERA_TOPIC_CREATE = 20,
			TASK_TYPE_HEDERA_TOPIC_MESSAGE = 21,
			TASK_TYPE_HEDERA_ACCOUNT_CREATE = 25,

		};
		
		typedef Poco::Tuple<int, int, int, Poco::Data::BLOB, Poco::DateTime, Poco::DateTime, std::string, int, int, int> PendingTaskTuple;

		class PendingTask : public ModelBase
		{
		public:

			PendingTask();
			PendingTask(int userId, std::string serializedProtoRequest, TaskType type);
			PendingTask(const PendingTaskTuple& tuple);

			~PendingTask();

			// generic db operations
			const char* getTableName() const { return "pending_tasks"; }
			std::string toString();

			//! \brief update table row with current request
			bool updateRequest();

			inline int getUserId() const { SHARED_LOCK; return mUserId; }
			inline int getHederaId() const { SHARED_LOCK; return mHederaId; }
			inline const std::vector<unsigned char>& getRequest() const { SHARED_LOCK; return mRequest.content(); }
			inline std::string getRequestCopy() const { SHARED_LOCK; return std::string((const char*)mRequest.content().data(), mRequest.content().size()); }
			inline Poco::DateTime getCreated() const { SHARED_LOCK; return mCreated; }
			inline TaskType getTaskType() const { SHARED_LOCK; return (TaskType)mTaskTypeId; }
			inline const char* getTaskTypeString() const { SHARED_LOCK; return typeToString((TaskType)mTaskTypeId); }
			inline int getChildPendingTaskId() const { SHARED_LOCK; return mChildPendingTaskId; }
			inline int getParentPendingTaskId() const { SHARED_LOCK; return mParentPendingTaskId; }

			inline void setUserId(int userId) { UNIQUE_LOCK;  mUserId = userId; }
			inline void setHederaId(int hederaId) { UNIQUE_LOCK; mHederaId = hederaId; }
			void setRequest(const std::string& serializedProto);
			inline void setTaskType(TaskType type) { UNIQUE_LOCK; mTaskTypeId = type; }
			inline void setChildPendingTaskId(int childPendingTaskId) {UNIQUE_LOCK; mChildPendingTaskId = childPendingTaskId;}
			inline void setParentPendingTaskId(int parentPendingTaskId) { UNIQUE_LOCK; mParentPendingTaskId = parentPendingTaskId; }
			
			inline bool isGradidoTransaction() { SHARED_LOCK; return isGradidoTransaction((TaskType)mTaskTypeId); }
			static bool isGradidoTransaction(TaskType type);
			inline bool isHederaTransaction() { SHARED_LOCK; return isHederaTransaction((TaskType)mTaskTypeId); }
			static bool isHederaTransaction(TaskType type);

			static const char* typeToString(TaskType type);
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadAllFromDB(Poco::Data::Session session);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			int mHederaId;
			Poco::Data::BLOB mRequest;
			Poco::DateTime mCreated;
			Poco::DateTime mFinished;
			std::string mResultJsonString;
			int mTaskTypeId;
			int mChildPendingTaskId;
			int mParentPendingTaskId;

			std::shared_mutex mSharedMutex;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_PENDING_TASKS_INCLUDE