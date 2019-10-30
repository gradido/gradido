#include "JsonTransaction.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"

Poco::JSON::Object* JsonTransaction::handle(Poco::Dynamic::Var params)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	int session_id = 0;
	
	if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		auto transactionIT = queryParams.begin();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "session_id") {
				session_id = stoi(it->second);
				//break;
			}
			else if (it->first == "transaction_base64") {
				transactionIT = it;
			}
		}
		if (session_id) {
			auto sm = SessionManager::getInstance();
			auto session = sm->getSession(session_id);
			if (!session) {
				result->set("state", "error");
				result->set("msg", "session not found");
				return result;
			}
			if (!session->startProcessingTransaction(transactionIT->second)) {
				auto lastError = session->getLastError();
				if (lastError) delete lastError;
				result->set("state", "error");
				result->set("msg", "already enlisted");
				return result;
			}
			result->set("state", "success");
			return result;
		}
		else {
			result->set("state", "error");
			result->set("msg", "session id not set");
			return result;
		}
	}

	result->set("state", "error");
	result->set("msg", "format not implemented");

	return result;
}