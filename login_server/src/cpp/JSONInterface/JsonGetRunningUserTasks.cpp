#include "JsonGetRunningUserTasks.h"
#include "Poco/URI.h"

#include "../SingletonManager/SingletonTaskObserver.h"

Poco::JSON::Object* JsonGetRunningUserTasks::handle(Poco::Dynamic::Var params)
{
	std::string email;
	
	bool parameterReaded = false;
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("email").convert(email);
			parameterReaded = true;
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else if (params.isStruct()) {
		auto _email = params["email"];
		parameterReaded = true;
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
		parameterReaded = true;
	}
	else {
		return stateError("format not implemented", std::string(params.type().name()));
	}
	if (!parameterReaded) {
		return stateError("parameter couldn't parsed");
	}
	if ("" == email) {
		return stateError("empty email");
	}

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
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	result->set("runningTasks", tasksJson);
	return result;

}