#include "JsonLogout.h"



#include "../SingletonManager/SessionManager.h"


Poco::JSON::Object* JsonLogout::handle(Poco::Dynamic::Var params)
{
	
	auto sm = SessionManager::getInstance();
	int session_id = 0;

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
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	auto session = sm->getSession(session_id);
	if (!session) {
		return stateError("session not found", std::to_string(session_id));
	}
	if (sm->releaseSession(session_id)) {
		return stateSuccess();
	}
	return stateError("error by releasing session");

	

}