#include "JsonGetLogin.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"

Poco::JSON::Object* JsonGetLogin::handle(Poco::Dynamic::Var params)
{
	
	int session_id = 0;
	Poco::JSON::Object* result = new Poco::JSON::Object;
	if (params.isStruct()) {
		session_id = params["session_id"];
		//std::string miau = params["miau"];
	}
	else if (params.isVector()) {
		try {
			const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
			for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
				if (it->first == "session_id") {
					session_id = stoi(it->second);
					break;
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
		if (session) {
			auto user = session->getUser();
			if (!user) {
				result->set("state", "not found");
				result->set("msg", "Session didn't contain user");
				return result;
			}
			result->set("state", "success");
			result->set("clientIP", session->getClientIp().toString());
			result->set("user", user->getJson());
			result->set("Transaction.pending", session->getProcessingTransactionCount());
			//printf("pending: %d\n", session->getProcessingTransactionCount());
			return result;
		}
		else {
			result->set("state", "not found");
			result->set("msg", "Session not found");
			return result;
		}
		
	}
	else {
		result->set("state", "error");
		result->set("msg", "empty session id");
	}

	return result;
}