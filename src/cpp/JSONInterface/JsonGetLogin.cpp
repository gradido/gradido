#include "JsonGetLogin.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonGetLogin::handle(Poco::Dynamic::Var params)
{
	
	int session_id = 0;
	auto sm = SessionManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();

	if (params.isStruct()) {
		session_id = params["session_id"];
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
					break;
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
	
	auto session = sm->getSession(session_id);
	if (!session) {
		return customStateError("not found", "session not found");
	}
	
	auto userNew = session->getNewUser();
	//auto user = session->getUser();
	if (userNew.isNull()) {
		return customStateError("not found", "Session didn't contain user");
	}
	auto userModel = userNew->getModel();
	if(userModel.isNull()) {
		return customStateError("not found", "User is empty");
	}
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	result->set("clientIP", session->getClientIp().toString());
	try {
		result->set("user", userNew->getJson());
	}
	catch (Poco::Exception ex) {
		auto em = ErrorManager::getInstance();
		em->addError(new ParamError("JsonGetLogin::handle", "poco exception calling userModel->getJson: ", ex.displayText().data()));
		em->sendErrorsAsEmail();
	}
	catch (...) {
		auto em = ErrorManager::getInstance();
		em->addError(new Error("JsonGetLogin::handle", "generic exception calling userModel->getJson: "));
		em->sendErrorsAsEmail();
	}
	result->set("Transaction.pending", session->getProcessingTransactionCount());
	auto executing = observer->getTaskCount(userModel->getEmail(), TASK_OBSERVER_SIGN_TRANSACTION);
	if (executing < 0) {
		executing = 0;
	}
	result->set("Transaction.executing", executing);
	//printf("pending: %d\n", session->getProcessingTransactionCount());
	std::string user_string = userModel->toString();
	printf("[JsonGetLogin] %s\n", user_string.data());
	return result;

}