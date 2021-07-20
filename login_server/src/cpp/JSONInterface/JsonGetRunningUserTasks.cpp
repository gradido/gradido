#include "JsonGetRunningUserTasks.h"
#include "Poco/URI.h"

#include "../SingletonManager/SingletonTaskObserver.h"

using namespace rapidjson;

Document JsonGetRunningUserTasks::handle(const Document& params)
{
	std::string email;
	auto paramError = getStringParameter(params, "email", email);
	if (!paramError.IsNull()) {
		return paramError;
	}

	auto ob = SingletonTaskObserver::getInstance();
	auto tasks = ob->getTasksCount(email);
	Document result; result.SetObject();
	auto alloc = result.GetAllocator();
	Value tasksJson; tasksJson.SetObject();
	if (tasks.size() > 0) {
		for (int i = 0; i < TASK_OBSERVER_COUNT; i++) {
			if (tasks[i] > 0) {
				std::string typeName = SingletonTaskObserver::TaskObserverTypeToString(static_cast<TaskObserverType>(i));
				tasksJson.AddMember(Value(typeName.data(), alloc), tasks[i], alloc);
			}
		}
	}
	
	result.AddMember("state", "success", alloc);
	result.AddMember("runningTasks", tasksJson, alloc);
	return result;
}
