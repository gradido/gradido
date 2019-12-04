#include "JsonTransaction.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"

Poco::JSON::Object* JsonTransaction::handle(Poco::Dynamic::Var params)
{
	Poco::JSON::Object* result = new Poco::JSON::Object;
	int session_id = 0;
	
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();

		try {
			/// Throws a RangeException if the value does not fit
			/// into the result variable.
			/// Throws a NotImplementedException if conversion is
			/// not available for the given type.
			/// Throws InvalidAccessException if Var is empty.
			paramJsonObject->get("session_id").convert(session_id);
			auto sm = SessionManager::getInstance();
			if (session_id != 0) {
				auto session = sm->getSession(session_id);
				if (!session) {
					result->set("state", "error");
					result->set("msg", "session not found");
					return result;
				}

				int balance = 0;
				paramJsonObject->get("balance").convert(balance);
				if (balance) {
					auto u = session->getUser();
					if (u) {
						u->setBalance(balance);
					}
				}

				std::string transactionBase64String;
				paramJsonObject->get("transaction_base64").convert(transactionBase64String);

				if (!session->startProcessingTransaction(transactionBase64String)) {
					auto lastError = session->getLastError();
					if (lastError) delete lastError;
					result->set("state", "error");
					result->set("msg", "already enlisted");
					return result;
				}

				result->set("state", "success");
				return result;
			}

		}
		catch (Poco::Exception& ex) {
			printf("[JsonTransaction::handle] try to use params as jsonObject: %s\n", ex.displayText().data());
		}
	}
	else if (params.isVector()) {
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
	else if (params.isStruct()) {
		result->set("state", "error");
		result->set("msg", "struct not implemented yet");
	}
	else if (params.isArray()) {
		result->set("state", "error");
		result->set("msg", "array not implemented yet");
	}
	else if (params.isList()) {
		result->set("state", "error");
		result->set("msg", "list not implemented yet");
	}
	else if (params.isString()) {
		result->set("state", "error");
		result->set("msg", "string not implemented yet");
	}
	else if (params.isDeque()) {
		result->set("state", "error");
		result->set("meg", "deque not implemented yet");
	}
	else {

		result->set("state", "error");
		result->set("msg", "format not implemented");
		result->set("details", std::string(params.type().name()));
	}

	return result;
}