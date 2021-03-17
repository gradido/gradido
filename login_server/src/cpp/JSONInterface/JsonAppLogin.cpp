#include "JsonAppLogin.h"

#include "Poco/URI.h"

#include "../lib/DataTypeConverter.h"

#include "../controller/AppAccessToken.h"
#include "../controller/User.h"

#include "../SingletonManager/SessionManager.h"


Poco::JSON::Object* JsonAppLogin::handle(Poco::Dynamic::Var params)
{
	Poco::UInt64 access_token_code;
	if (params.isVector()) {
		try {
			const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
			for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
				if (it->first == "access_token") {
					auto numberParseResult = DataTypeConverter::strToInt(it->second, access_token_code);
					if (DataTypeConverter::NUMBER_PARSE_OKAY != numberParseResult) {
						return stateError("error parsing access token", DataTypeConverter::numberParseStateToString(numberParseResult));
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
	auto sm = SessionManager::getInstance();
	auto access_token = controller::AppAccessToken::load(access_token_code);
	if (access_token.isNull()) {
		return stateError("access token not found");
	}
	Poco::Timespan max_age;
	max_age.assign(7, 0, 0, 0, 0);
	if (access_token->getAge() > max_age) {
		access_token->deleteFromDB();
		return stateError("access token to old");
	}
	access_token->getModel()->update();
	auto session = sm->getNewSession();
	auto user = controller::User::create();
	if (1 != user->load(access_token->getModel()->getUserId())) {
		return stateError("access token invalid");
	}
	session->setUser(user);

	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	result->set("session_id", session->getHandle());

	return result;

}