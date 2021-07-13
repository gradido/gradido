#include "JsonCheckSessionState.h"
#include "Poco/URI.h"
#include "../lib/DataTypeConverter.h"
#include "../SingletonManager/SessionManager.h"

#include "rapidjson/document.h"

Poco::JSON::Object* JsonCheckSessionState::handle(Poco::Dynamic::Var params)
{
	int session_id = 0;

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
			paramJsonObject->get("session_id").convert(session_id);
			parameterReaded = true;
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "session_id") {
				DataTypeConverter::strToInt(it->second, session_id);
				//session_id = it->second;
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
	auto sm = SessionManager::getInstance();
	auto session = sm->getSession(session_id);
	if (session) {
		return stateSuccess();
	}
	else {
		return customStateError("not found", "session not found");
	}

}

rapidjson::Document JsonCheckSessionState::handle(const rapidjson::Document& params)
{
	rapidjson::Value::ConstMemberIterator itr = params.FindMember("session_id");
	if (itr == params.MemberEnd()) {
		return rstateError("session_id not found");
	}
	
	if (!itr->value.IsInt()) {
		return rstateError("session_id invalid");
	}
	auto sm = SessionManager::getInstance();
	auto session = sm->getSession(itr->value.GetInt());
	if (session) {
		return rstateSuccess();
	}
	else {
		return rcustomStateError("not found", "session not found");
	}
	
}