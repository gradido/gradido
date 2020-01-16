#include "JsonGetUsers.h"
#include "Poco/URI.h"
#include "Poco/JSON/Array.h"

#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"

Poco::JSON::Object* JsonGetUsers::handle(Poco::Dynamic::Var params)
{

	int session_id = 0;
	std::string searchString;
	Poco::JSON::Object* result = new Poco::JSON::Object;
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
			printf("[JsonGetUsers::handle] try to use params as jsonObject: %s\n", ex.displayText().data());
			result->set("state", "error");
			result->set("msg", "json exception");
			result->set("details", ex.displayText());
			return result;
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
					session_id = stoi(it->second);
				}
				else if (it->first == "search") {
					searchString = it->second;
				}
			}
			//auto var = params[0];
		}
		catch (const std::invalid_argument& ia) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, invalid argument: ");
			result->set("details", ia.what());
			return result;
		}
		catch (const std::out_of_range& oor) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, Out of Range error: ");
			result->set("details", oor.what());
			return result;
		}
		catch (const std::logic_error & ler) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, Logical error: ");
			result->set("details", ler.what());
			return result;
		}
		catch (Poco::Exception& ex) {
			//printf("[JsonGetLogin::handle] exception: %s\n", ex.displayText().data());
			result->set("state", "error");
			result->set("msg", "error parsing query params, Poco Error");
			result->set("details", ex.displayText());
			return result;
		}
	}

	if (session_id) {
		auto sm = SessionManager::getInstance();
		auto session = sm->getSession(session_id);
		//Session* session = nullptr;
		if (session) {
			auto user = session->getNewUser();
			if (user.isNull()) {
				result->set("state", "not found");
				result->set("msg", "Session didn't contain user");
				return result;
			}
			else if (searchString == "") {
				result->set("state", "not found");
				result->set("msg", "search string is empty");
				return result;
			}
			else if (user->getModel()->getRole() != model::table::ROLE_ADMIN) {
				result->set("state", "wrong role");
				result->set("msg", "User hasn't correct role");
				return result;
			}

			auto results = controller::User::search(searchString);
			if (results.size() > 0) {
				result->set("state", "success");

				//Poco::JSON::Object jsonResultObject;
				Poco::JSON::Array  jsonUsersArray;

				for (auto it = results.begin(); it != results.end(); it++) {
					jsonUsersArray.add((*it)->getJson());
					(*it)->release();
				}
				results.clear();
				result->set("users", jsonUsersArray);
			}
			
		}
		else {
			result->set("state", "not found");
			result->set("msg", "session not found");
		}

	}
	else {
		result->set("state", "error");
		result->set("msg", "empty session id");
	}

	return result;
}