#include "PendingTask.h"

//#include <sstream>

using namespace Poco::Data::Keywords;

namespace model
{
	namespace table
	{
		PendingTask::PendingTask()
			: mUserId(0), mTaskTypeId(TASK_TYPE_NONE)
		{

		}
		PendingTask::PendingTask(int userId, std::string serializedProtoRequest, TaskType type)
			: mUserId(userId), mRequest((const unsigned char*)serializedProtoRequest.data(), serializedProtoRequest.size()),
			  mTaskTypeId(TASK_TYPE_NONE)
		{
			
		}
		PendingTask::PendingTask(const PendingTaskTuple& tuple)
			: ModelBase(tuple.get<0>()), mUserId(tuple.get<1>()), mHederaId(tuple.get<2>()),
			mRequest(tuple.get<3>()), mCreated(tuple.get<4>()), mFinished(tuple.get<5>()),
			mResultJsonString(tuple.get<6>()), mTaskTypeId(tuple.get<7>()), mChildPendingTaskId(tuple.get<8>()), mParentPendingTaskId(tuple.get<9>())
		{

		}
		PendingTask::~PendingTask()
		{

		}

		void PendingTask::setRequest(const std::string& serializedProto)
		{
			UNIQUE_LOCK;
			mRequest.assignRaw((const unsigned char*)serializedProto.data(), serializedProto.size());
		}
		
		bool PendingTask::updateRequest()
		{
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			SHARED_LOCK;
			if (!mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE " << getTableName() << " SET request = ? where id = ?;",
				use(mRequest), use(mID);

			try {
				return 1 == update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updateRequest] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return 0;
		}

		std::string PendingTask::toString()
		{
			std::stringstream ss;
			std::shared_lock<std::shared_mutex> _lock(mSharedMutex);
			return ss.str();
		}

		
		const char* PendingTask::typeToString(TaskType type)
		{
			switch (type) {
			case TASK_TYPE_GROUP_CREATE: return "group create";
			case TASK_TYPE_GROUP_ADD_MEMBER: return "group add member";
			case TASK_TYPE_CREATION: return "creation";
			case TASK_TYPE_TRANSFER: return "transfer";
			case TASK_TYPE_HEDERA_TOPIC_CREATE: return "hedera topic create";
			case TASK_TYPE_HEDERA_TOPIC_MESSAGE: return "hedera topic send message";
			case TASK_TYPE_HEDERA_ACCOUNT_CREATE: return "hedera account create";
			default: return "<unknown>";
			}
			return "<invalid>";
		}
		/*enum TaskType {
			TASK_TYPE_NONE = 0,
			TASK_TYPE_GROUP_CREATE = 1,
			TASK_TYPE_GROUP_ADD_MEMBER = 2,
			TASK_TYPE_CREATION = 10,
			TASK_TYPE_TRANSFER = 11,
			TASK_TYPE_HEDERA_TOPIC_CREATE = 20,
			TASK_TYPE_HEDERA_TOPIC_MESSAGE = 21,
			TASK_TYPE_HEDERA_ACCOUNT_CREATE = 25,

		};*/
		bool PendingTask::isGradidoTransaction(TaskType type)
		{
			if (type && type < TASK_TYPE_HEDERA_TOPIC_CREATE)
				return true;
			return false;
		}

		bool PendingTask::isHederaTransaction(TaskType type)
		{
			if (type && type >= TASK_TYPE_HEDERA_TOPIC_CREATE)
				return true;
			return false;
		}
	
		Poco::Data::Statement PendingTask::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, hedera_id, request, created, finished, result_json, task_type_id, child_pending_task_id, parent_pending_task_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mHederaId), into(mRequest), into(mCreated), into(mFinished), into(mResultJsonString),
				into(mTaskTypeId), into(mChildPendingTaskId), into(mParentPendingTaskId);

			return select;
		}

		Poco::Data::Statement PendingTask::_loadAllFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, hedera_id, request, created, finished, result_json, task_type_id, child_pending_task_id, parent_pending_task_id FROM " 
				   << getTableName() << " order by id";

			return select;
		}

		Poco::Data::Statement PendingTask::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			select << "SELECT id FROM " << getTableName()
				<< " WHERE user_id = ? "
				<< " AND TIMESTAMPDIFF(SECOND, created, ?) = 0 "
				<< " AND task_type_id = ? "
				, into(mID), use(mUserId), use(mCreated), use(mTaskTypeId);
			
			return select;
		}


		Poco::Data::Statement PendingTask::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);
			Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);

			insert << "INSERT INTO " << getTableName()
				<< " (user_id, hedera_id, request, created, task_type_id, child_pending_task_id, parent_pending_task_id) VALUES(?,?,?,?,?,?,?)"
				, use(mUserId), use(mHederaId), use(mRequest), use(mCreated), use(mTaskTypeId), use(mChildPendingTaskId), use(mParentPendingTaskId);
			
			return insert;
		}
	}
}