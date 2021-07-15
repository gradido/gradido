#include "JsonAquireAccessToken.h"

#include "../SingletonManager/SessionManager.h"

#include "../controller/AppAccessToken.h"
#include "../controller/Group.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonAquireAccessToken::handle(const Document& params)
{
	auto session_result = rcheckAndLoadSession(params);
	if (session_result.IsObject()) {
		return session_result;
	}
	
	Document result;
	result.SetObject();
	result.AddMember("state", "success", result.GetAllocator());
	auto user = mSession->getNewUser();
	auto user_id = user->getModel()->getID();
	auto access_tokens = controller::AppAccessToken::load(user_id);
	Poco::AutoPtr<controller::AppAccessToken> access_token;
	if (access_tokens.size() > 0) {
		access_token = access_tokens[0];
		access_token->getModel()->update();
	}
	else {
		access_token = controller::AppAccessToken::create(user_id);
		// for a bit faster return
		UniLib::controller::TaskPtr task = new model::table::ModelInsertTask(access_token->getModel(), false, true);
		task->scheduleTask(task);
		// default 
		//access_token->getModel()->insertIntoDB(false);
	}
	std::string access_token_string = std::to_string(access_token->getModel()->getCode());
	result.AddMember("access_token", Value(access_token_string.data(), result.GetAllocator()).Move(), result.GetAllocator());

	auto group_base_url = user->getGroupBaseUrl();
	auto group = controller::Group::load(user->getModel()->getGroupId());
	if (!group.isNull()) {
		result.AddMember("group_base_url", Value(group->getModel()->getUrl().data(), result.GetAllocator()).Move(), result.GetAllocator());
	}

	return result;

}