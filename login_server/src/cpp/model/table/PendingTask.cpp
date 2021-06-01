#include "PendingTask.h"

#include "Poco/JSON/Parser.h"
//#include <sstream>

using namespace Poco::Data::Keywords;

namespace model
{
	namespace table
	{
		PendingTask::PendingTask()
			: mUserId(0), mTaskTypeId(TASK_TYPE_NONE), mChildPendingTaskId(0), mParentPendingTaskId(0)
		{

		}
		PendingTask::PendingTask(int userId, std::string serializedProtoRequest, TaskType type)
			: mUserId(userId), mRequest((const unsigned char*)serializedProtoRequest.data(), serializedProtoRequest.size()),
			  mTaskTypeId(TASK_TYPE_NONE), mChildPendingTaskId(0), mParentPendingTaskId(0)
		{

		}
		PendingTask::PendingTask(const PendingTaskTuple& tuple)
			: ModelBase(tuple.get<0>()), mUserId(tuple.get<1>()),
			mRequest(tuple.get<2>()), mCreated(tuple.get<3>()), mFinished(tuple.get<4>()),
			mResultJsonString(tuple.get<5>()), mParamJsonString(tuple.get<6>()), mTaskTypeId(tuple.get<7>()), mChildPendingTaskId(tuple.get<8>()), mParentPendingTaskId(tuple.get<9>())
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

		void PendingTask::setResultJson(Poco::JSON::Object::Ptr result)
		{
			UNIQUE_LOCK;
			std::stringstream ss;
			try {
				result->stringify(ss);
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError("PendingTask::setResultJson", "exception by json -> string", ex.displayText()));
			}
			mResultJsonString = ss.str();
		}

		void PendingTask::setParamJson(Poco::JSON::Object::Ptr param)
		{
			UNIQUE_LOCK;
			std::stringstream ss;
			try {
				param->stringify(ss);
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError("PendingTask::setParamJson", "exception by json -> string", ex.displayText()));
			}
			mParamJsonString = ss.str();
		}

		Poco::JSON::Object::Ptr PendingTask::getResultJson() const
		{
			std::string temp;
			{
				SHARED_LOCK;
				temp = mResultJsonString;
			}
			Poco::JSON::Parser parser;
			Poco::Dynamic::Var result;
			try
			{
				result = parser.parse(temp);
			}
			catch (Poco::JSON::JSONException& json)
			{
				return new Poco::JSON::Object;
			}

			return result.extract<Poco::JSON::Object::Ptr>();

		}

		Poco::JSON::Object::Ptr PendingTask::getParamJson() const
		{
			std::string temp;
			{
				SHARED_LOCK;
				temp = mParamJsonString;
			}
			Poco::JSON::Parser parser;
			Poco::Dynamic::Var result;
			try
			{
				result = parser.parse(temp);
			}
			catch (Poco::JSON::JSONException& jsone)
			{
				return new Poco::JSON::Object;
			}

			return result.extract<Poco::JSON::Object::Ptr>();
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

		bool PendingTask::updateFinishedAndResult()
		{
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			SHARED_LOCK;
			if (!mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE " << getTableName() << " SET finished = ?, result_json = ? where id = ?;",
				use(mFinished), use(mResultJsonString), use(mID);

			try {
				return 1 == update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updateFinishedAndResult] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return 0;
		}

		bool PendingTask::updateParam()
		{
			Poco::ScopedLock<Poco::Mutex> _poco_lock(mWorkMutex);
			SHARED_LOCK;
			if (!mID) {
				return 0;
			}
			auto cm = ConnectionManager::getInstance();
			auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);

			Poco::Data::Statement update(session);

			update << "UPDATE " << getTableName() << " SET param_json = ? where id = ?;",
				use(mParamJsonString), use(mID);

			try {
				return 1 == update.execute();
			}
			catch (Poco::Exception& ex) {
				addError(new ParamError(getTableName(), "[updateParam] mysql error by update", ex.displayText().data()));
				addError(new ParamError(getTableName(), "data set: \n", toString().data()));
			}
			//printf("data valid: %s\n", toString().data());
			return false;
		}



		std::string PendingTask::toString()
		{
			std::stringstream ss;
			ss << "id: " << mID << std::endl;
			ss << "user_id: " << mUserId << std::endl;
			ss << "created: " << Poco::DateTimeFormatter::format(mCreated, "%f.%m.%Y %H:%M:%S") << std::endl;
			ss << "task type: " << typeToString((TaskType)mTaskTypeId) << std::endl;
			ss << "child pending task id: " << std::to_string(mChildPendingTaskId) << std::endl;
			ss << "parent pending task id: " << std::to_string(mParentPendingTaskId) << std::endl;
			return ss.str();
		}


		const char* PendingTask::typeToString(TaskType type)
		{
			switch (type) {
			case TASK_TYPE_GROUP_CREATE: return "group create";
			case TASK_TYPE_GROUP_ADD_MEMBER: return "group add member";
			case TASK_TYPE_CREATION: return "creation";
			case TASK_TYPE_TRANSFER: return "transfer";
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
			return true;
		}


		Poco::Data::Statement PendingTask::_loadFromDB(Poco::Data::Session session, const std::string& fieldName)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, request, created, finished, result_json, param_json, task_type_id, child_pending_task_id, parent_pending_task_id FROM " << getTableName()
				<< " where " << fieldName << " = ?"
				, into(mID), into(mUserId), into(mRequest), into(mCreated), into(mFinished), into(mResultJsonString), into(mParamJsonString),
				into(mTaskTypeId), into(mChildPendingTaskId), into(mParentPendingTaskId);

			return select;
		}

		Poco::Data::Statement PendingTask::_loadAllFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id, user_id, request, created, finished, result_json, param_json, task_type_id, child_pending_task_id, parent_pending_task_id FROM "
				   << getTableName() << " order by id";

			return select;
		}

		Poco::Data::Statement PendingTask::_loadIdFromDB(Poco::Data::Session session)
		{
			Poco::Data::Statement select(session);

			select << "SELECT id FROM " << getTableName()
				<< " WHERE user_id = ? "
				<< " AND request = ?"
				<< " AND TIMESTAMPDIFF(SECOND, created, ?) = 0 "
				<< " AND task_type_id = ? "
				, into(mID), use(mUserId), use(mRequest), use(mCreated), use(mTaskTypeId);

			return select;
		}


		Poco::Data::Statement PendingTask::_insertIntoDB(Poco::Data::Session session)
		{
			Poco::Data::Statement insert(session);

			insert << "INSERT INTO " << getTableName()
				<< " (user_id, request, created, result_json, param_json, task_type_id, child_pending_task_id, parent_pending_task_id) VALUES(?,?,?,?,?,?,?,?)"
				, use(mUserId), use(mRequest), use(mCreated), use(mResultJsonString), use(mParamJsonString), use(mTaskTypeId), use(mChildPendingTaskId), use(mParentPendingTaskId);

			return insert;
		}
	}
}
