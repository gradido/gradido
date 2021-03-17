#include "JsonGetUsers.h"
#include "Poco/URI.h"
#include "Poco/JSON/Array.h"

#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonGetUsers::handle(Poco::Dynamic::Var params)
{

	int session_id = 0;
	std::string searchString;
	
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("search").convert(searchString);
			paramJsonObject->get("session_id").convert(session_id);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else if (params.isStruct()) {
		session_id = params["session_id"];
		searchString = params["search"].toString();
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		try {
			const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
			for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
				if (it->first == "session_id") {
					auto numberParseResult = DataTypeConverter::strToInt(it->second, session_id);
					if (DataTypeConverter::NUMBER_PARSE_OKAY != numberParseResult) {
						return stateError("error parsing session_id", DataTypeConverter::numberParseStateToString(numberParseResult));
					}
				}
				else if (it->first == "search") {
					searchString = it->second;
				}
			}
			//auto var = params[0];
		}
		catch (Poco::Exception& ex) {
			return stateError("error parsing query params, Poco Error", ex.displayText());
		}
	}

	if (!session_id) {
		return stateError("empty session id");
	}

	
	auto sm = SessionManager::getInstance();
	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "Session not found");
	}
	
	auto user = session->getNewUser();
	if (user.isNull()) {
		return customStateError("not found", "Session didn't contain user");
	}
	else if (searchString == "") {
		return customStateError("not found", "Search string is empty");
	}
	else if (user->getModel()->getRole() != model::table::ROLE_ADMIN) {
		return customStateError("wrong role", "User hasn't correct role");
	}

	auto results = controller::User::search(searchString);
	if (!results.size()) {
		return stateSuccess();
	}
	
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");

	//Poco::JSON::Object jsonResultObject;
	Poco::JSON::Array  jsonUsersArray;

	for (auto it = results.begin(); it != results.end(); it++) {
		jsonUsersArray.add((*it)->getJson());
		(*it)->release();
	}
	results.clear();
	result->set("users", jsonUsersArray);

	return result;
}