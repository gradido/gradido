#include "JsonAquireAccessToken.h"
#include "Poco/URI.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ErrorManager.h"

#include "../controller/AppAccessToken.h"

#include "../lib/DataTypeConverter.h"

Poco::JSON::Object* JsonAquireAccessToken::handle(Poco::Dynamic::Var params)
{
	auto session_result = checkAndLoadSession(params);
	if (session_result) {
		return session_result;
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
		access_token->getModel()->insertIntoDB(false);
	}

	result->set("access_token", std::to_string(access_token->getModel()->getCode()));

	return result;

}