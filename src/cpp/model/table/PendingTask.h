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

		typedef Poco::Tuple<int, int, Poco::Data::BLOB, Poco::DateTime, Poco::DateTime, std::string, int> PendingTaskTuple;

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


			static const char* typeToString(TaskType type);
		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			Poco::Data::BLOB mRequest;
			Poco::DateTime mCreated;
			Poco::DateTime mFinished;
			std::string mResultJsonString;
			int mTaskTypeId;

			std::shared_mutex mSharedMutex;

		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_PENDING_TASKS_INCLUDE