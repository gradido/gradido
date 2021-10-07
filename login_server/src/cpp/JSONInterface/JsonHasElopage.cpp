#include "JsonHasElopage.h"
#include "../model/table/ElopageBuy.h"

Poco::JSON::Object* JsonHasElopage::handle(Poco::Dynamic::Var params)
{
	auto result = checkAndLoadSession(params);
	if (result) {
		return result;
	}
	auto elopage_buy = Poco::AutoPtr<model::table::ElopageBuy>();
	
	result = stateSuccess();
	result->set("hasElopage", elopage_buy->isExistInDB("email", mSession->getNewUser()->getModel()->getEmail()));

	return result;
}