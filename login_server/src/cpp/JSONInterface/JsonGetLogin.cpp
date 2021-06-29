#include "JsonGetLogin.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/PendingTasksManager.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonGetLogin::handle(Poco::Dynamic::Var params)
{
	auto sm = SessionManager::getInstance();
	auto pt = PendingTasksManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();

	//if(!mClientIp.isLoopback())
	auto session_check_result = checkAndLoadSession(params, false);
	if (session_check_result) {
		return session_check_result;
	}

	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	//result->set("clientIP", mSession->getClientIp().toString());
	auto userNew = mSession->getNewUser();
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
	int pending = 0;
	auto user_must_sign = pt->getTransactionsUserMustSign(userNew);
	pending = user_must_sign.size();
	result->set("Transactions.pending", pending);

	auto some_must_sign = pt->getTransactionSomeoneMustSign(userNew);
	//pending = some_must_sign.size();
	result->set("Transactions.can_signed", some_must_sign.size());

	auto executing = observer->getTaskCount(userNew->getModel()->getEmail(), TASK_OBSERVER_SIGN_TRANSACTION);
	if (executing < 0) {
		executing = 0;
	}
	result->set("Transactions.executing", executing);
	//printf("pending: %d\n", session->getProcessingTransactionCount());
	//std::string user_string = userModel->toString();
	//printf("[JsonGetLogin] %s\n", user_string.data());
	return result;

}
