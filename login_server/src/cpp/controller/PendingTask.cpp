#include "PendingTask.h"

#include "../model/gradido/Transaction.h"

#include "../SingletonManager/PendingTasksManager.h"
#include "../SingletonManager/ErrorManager.h"

namespace controller {

	PendingTask::PendingTask(model::table::PendingTask* dbModel)
	{
		mDBModel = dbModel;
	}

	PendingTask::~PendingTask()
	{

	}

	Poco::AutoPtr<PendingTask> PendingTask::create(int userId, std::string serializedProtoRequest, model::table::TaskType type)
	{
		auto db = new model::table::PendingTask(userId, serializedProtoRequest, type);
		//auto pending_task = new PendingTask(db);
		auto pending_task = loadCorrectDerivedClass(db);
		return Poco::AutoPtr<PendingTask>(pending_task);
	}

	std::vector<Poco::AutoPtr<PendingTask>> PendingTask::load(int userId)
	{
		auto db = new model::table::PendingTask();
		auto pending_task_list = db->loadFromDB<int, model::table::PendingTaskTuple>("user_id", userId, 3);
		std::vector<Poco::AutoPtr<PendingTask>> resultVector;
		resultVector.reserve(pending_task_list.size());
		for (auto it = pending_task_list.begin(); it != pending_task_list.end(); it++) {
			//resultVector.push_back(new PendingTask(new model::table::PendingTask(*it)));
			resultVector.push_back(loadCorrectDerivedClass(new model::table::PendingTask(*it)));
		}
		return resultVector;


	}

	/*Poco::AutoPtr<PendingTask> PendingTask::loadCorrectDerivedClass(model::table::PendingTask* dbModel)
	{
		if (dbModel->isGradidoTransaction()) {
			return model::gradido::Transaction::load(dbModel);
		}
	}*/
	Poco::AutoPtr<PendingTask> PendingTask::loadCorrectDerivedClass(model::table::PendingTask* dbModel)
	{
		/*if (!dbModel) return nullptr;
		auto type = dbModel->getTaskType();
		switch (type) {
		case model::table::TASK_TYPE_GROUP_ADD_MEMBER: return new GradidoGroupAddMemberTask(dbModel);
		default: return nullptr;*/
		if (dbModel->isGradidoTransaction()) {
			return model::gradido::Transaction::load(dbModel);
		}

		return nullptr;
	}

	std::vector<Poco::AutoPtr<PendingTask>> PendingTask::loadAll()
	{
		auto db = new model::table::PendingTask();
		std::vector<model::table::PendingTaskTuple> task_list;
		// throw an unresolved external symbol error
		task_list = db->loadAllFromDB<model::table::PendingTaskTuple>();


		//*/ //work around end
		std::vector<Poco::AutoPtr<PendingTask>> resultVector;

		resultVector.reserve(task_list.size());
		for (auto it = task_list.begin(); it != task_list.end(); it++) {
			auto group_ptr = loadCorrectDerivedClass(new model::table::PendingTask(*it));
			resultVector.push_back(group_ptr);
		}
		return resultVector;
	}

	bool PendingTask::deleteFromDB()
	{
		Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
		auto result = mDBModel->deleteFromDB();
		return result;
	}

	Poco::AutoPtr<controller::User> PendingTask::getUser()
	{
		if (!mUser.isNull()) {
			return mUser;
		}
		auto user_id = getModel()->getUserId();
		if (!user_id) {
			return nullptr;
		}
		mUser = controller::User::create();
		mUser->load(user_id);
		return mUser;

	}

	void PendingTask::startTimer()
	{
		Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
		static const char* function_name = "PendingTask::startTimer";
		auto em = ErrorManager::getInstance();

		if (isTimeoutTask()) {
			auto next_run_time = getNextRunTime();
			if (next_run_time >= Poco::DateTime()) {
				auto result = run();
				if (result != 1 && result != -1) {
					return;
				}
				next_run_time = getNextRunTime();
			}
			if (next_run_time >= Poco::DateTime()) {
				em->addError(new Error(function_name, "get next runtime doesn't seem to work correctly"));
				em->addError(new ParamError(function_name, "task type", getModel()->getTaskTypeString()));
				em->sendErrorsAsEmail();
			}
			next_run_time = getNextRunTime();
			auto interval = next_run_time - Poco::DateTime();
			printf("interval: %d\n", interval.milliseconds());
			if (interval.milliseconds() > 0) {
				mTimer.setStartInterval(interval.milliseconds());
			}
			else {
				mTimer.setStartInterval(100);
			}
			Poco::TimerCallback<PendingTask> callback(*this, &PendingTask::calledFromTimer);
			mTimer.start(callback);
		}

	}
	void PendingTask::calledFromTimer(Poco::Timer& timer)
	{
		Poco::DateTime now;
		std::string now_string = Poco::DateTimeFormatter::format(now, "%f.%m.%Y %H:%M:%S");
		printf("[PendingTask::calledFromTimer] now: %s\n", now_string.data());
		Poco::ScopedLock<Poco::Mutex> _lock(mWorkMutex);
		auto result = run();
		printf("run result: %d\n", result);
		if (result != 1 && result != -1) {
			timer.restart(0);
			return;
		}
		auto interval = Poco::Timespan(getNextRunTime() - Poco::DateTime()).milliseconds();
		if (interval <= 0) {
			interval = 100;
		}
		timer.restart(interval);
	}

	bool PendingTask::setParam(const std::string& key, const Poco::Dynamic::Var& value, bool saveIntoDB/* = false*/)
	{
		auto model = getModel();
		auto param = model->getParamJson();
		param->set(key, value);
		model->setParamJson(param);
		if (saveIntoDB) {
			return model->updateParam();
		}
		return true;
	}

	void PendingTask::finishSuccess()
	{
		getModel()->setFinished(Poco::DateTime());
		setResult("state", "success", true);
	}

	bool PendingTask::setResult(const std::string& key, const Poco::Dynamic::Var& value, bool saveIntoDB /*= false*/)
	{
		auto model = getModel();
		auto param = model->getResultJson();
		param->set(key, value);
		model->setResultJson(param);
		if (saveIntoDB) {
			return model->updateFinishedAndResult();
		}
		return true;
	}


	int PendingTask::getIntParam(const std::string& key)
	{
		auto model = getModel();
		auto param = model->getParamJson();
		auto paramVar = param->get(key);
		if (!paramVar.isEmpty() && paramVar.isInteger()) {
			try {
				return paramVar.extract<Poco::Int64>();
			}
			catch (Poco::Exception& ex) {
				NotificationList error;
				error.addError(new ParamError("PendingTask::getIntParam", "poco exception: ", ex.displayText()));
				return -2;
			}
		}
		return -1;
	}
}
