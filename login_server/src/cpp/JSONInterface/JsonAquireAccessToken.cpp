#include "JsonAquireAccessToken.h"

#include "../SingletonManager/SessionManager.h"

#include "../controller/AppAccessToken.h"
#include "../controller/Group.h"


Poco::JSON::Object* JsonAquireAccessToken::handle(Poco::Dynamic::Var params)
{
	if (!mSession || mSession->getNewUser().isNull()) {
		auto session_result = checkAndLoadSession(params, true);
		if (session_result) {
			return session_result;
		}
	}
	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
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

	result->set("access_token", std::to_string(access_token->getModel()->getCode()));

	auto group_base_url = user->getGroupBaseUrl();
	auto group = controller::Group::load(user->getModel()->getGroupId());
	if (!group.isNull()) {
		result->set("group_base_url", group->getModel()->getUrl());
	}

	return result;

}