#include "JsonCheckSessionState.h"

#include "../SingletonManager/SessionManager.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonCheckSessionState::handle(const Document& params)
{
	auto session_id_result = checkAndLoadSession(params);
	if (session_id_result.IsObject()) {
		return session_id_result;
	} 
	return stateSuccess();	
}