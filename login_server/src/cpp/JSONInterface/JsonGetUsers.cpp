#include "JsonGetUsers.h"
#include "Poco/URI.h"
#include "Poco/JSON/Array.h"

#include "../SingletonManager/SessionManager.h"
#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

using namespace rapidjson;

Document JsonGetUsers::handle(const Document& params)
{
	static std::string emptySearchString = "... empty ...";

	auto paramError = rcheckAndLoadSession(params);
	if (paramError.IsObject()) return paramError;

	std::string searchString;
	paramError = getStringParameter(params, "search", searchString);
	if (paramError.IsObject()) return paramError;

	std::string accountState;
	getStringParameter(params, "account_state", accountState);

	auto user = mSession->getNewUser();
	if (searchString == emptySearchString) {
		searchString = "";
	}
	
	if (searchString == "" && (accountState == "" || accountState == "all")) {
		return rcustomStateError("not found", "Search string is empty and account_state is all or empty");
	}
	else if (user->getModel()->getRole() != model::table::ROLE_ADMIN) {
		return rcustomStateError("wrong role", "User hasn't correct role");
	}

	auto results = controller::User::search(searchString, accountState);
	if (!results.size()) {
		return rstateSuccess();
	}
	Document result(kObjectType);
	auto alloc = result.GetAllocator();
	result.AddMember("state", "success", alloc);

	Value jsonUsers(kArrayType);

	for (auto it = results.begin(); it != results.end(); it++) {
		jsonUsers.PushBack((*it)->getJson(alloc), alloc);
		(*it)->release();
	}
	results.clear();
	result.AddMember("users", jsonUsers, alloc);

	return result;

}
