#include "JsonCheckSessionState.h"

#include "../SingletonManager/SessionManager.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonCheckSessionState::handle(const Document& params)
{
	int session_id = 0;
	auto session_id_result = getIntParameter(params, "session_id", session_id);
	if (session_id_result.IsObject()) {
		return session_id_result;
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