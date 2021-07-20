#include "JsonGetLogin.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/SingletonTaskObserver.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/PendingTasksManager.h"

#include "../lib/DataTypeConverter.h"

using namespace rapidjson;

Document JsonGetLogin::handle(const Document& params)
{
	auto sm = SessionManager::getInstance();
	auto pt = PendingTasksManager::getInstance();
	auto observer = SingletonTaskObserver::getInstance();

	//if(!mClientIp.isLoopback())
	auto session_check_result = rcheckAndLoadSession(params);
	if (!session_check_result.IsNull()) {
		return session_check_result;
	}

	Document result(kObjectType);
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);
	//result->set("clientIP", mSession->getClientIp().toString());
	auto userNew = mSession->getNewUser();
	try {
		result.AddMember("user", userNew->getJson(alloc), alloc);

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
	result.AddMember("Transactions.pending", pending, alloc);

	auto some_must_sign = pt->getTransactionSomeoneMustSign(userNew);
	//pending = some_must_sign.size();
	result.AddMember("Transactions.can_signed", some_must_sign.size(), alloc);

	auto executing = observer->getTaskCount(userNew->getModel()->getEmail(), TASK_OBSERVER_SIGN_TRANSACTION);
	if (executing < 0) {
		executing = 0;
	}
	result.AddMember("Transactions.executing", executing, alloc);
	return result;
}
