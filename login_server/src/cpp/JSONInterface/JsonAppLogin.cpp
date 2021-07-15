#include "JsonAppLogin.h"

#include "../controller/AppAccessToken.h"
#include "../controller/User.h"

#include "../SingletonManager/SessionManager.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonAppLogin::handle(const Document& params)
{
	Poco::UInt64 access_token_code;
	auto access_token_result = getUInt64Parameter(params, "access_token", access_token_code);
	if (access_token_result.IsObject()) {
		return access_token_result;
	}
	
	auto sm = SessionManager::getInstance();
	auto access_token = controller::AppAccessToken::load(access_token_code);
	if (access_token.isNull()) {
		return rstateError("access token not found");
	}
	Poco::Timespan max_age;
	max_age.assign(7, 0, 0, 0, 0);
	if (access_token->getAge() > max_age) {
		access_token->deleteFromDB();
		return rstateError("access token to old");
	}
	access_token->getModel()->update();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	if (1 != user->load(access_token->getModel()->getUserId())) {
		return rstateError("access token invalid");
	}
	session->setUser(user);

	Document result;
	result.SetObject();
	result.AddMember("state", "success", result.GetAllocator());
	result.AddMember("session_id", session->getHandle(), result.GetAllocator());

	return result;

}