#include "JsonGetRunningUserTasks.h"
#include "Poco/URI.h"

#include "../SingletonManager/SingletonTaskObserver.h"

Poco::JSON::Object* JsonGetRunningUserTasks::handle(Poco::Dynamic::Var params)
{
	std::string email;
	Poco::JSON::Object* result = new Poco::JSON::Object;
	if (params.isStruct()) {
		auto _email = params["email"];
		int zahl = 0;
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "email") {
				email = it->second;
				break;
			}
		}
	}

	if (email != "") {
		auto ob = SingletonTaskObserver::getInstance();
		auto tasks = ob->getTasksCount(email);
		Poco::JSON::Object tasksJson;
		if (tasks.size() > 0) {
			for (int i = 0; i < TASK_OBSERVER_COUNT; i++) {
				if (tasks[i] > 0) {
					std::string typeName = SingletonTaskObserver::TaskObserverTypeToString(static_cast<TaskObserverType>(i));
					tasksJson.set(typeName, tasks[i]);
				}
			}
		}
		
		result->set("state", "success");
		result->set("runningTasks", tasksJson);
	}
	else {
		result->set("state", "error");
		result->set("msg", "empty email");
	}

	return result;
}