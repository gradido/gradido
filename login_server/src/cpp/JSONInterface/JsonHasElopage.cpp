#include "JsonHasElopage.h"
#include "../model/table/ElopageBuy.h"

using namespace rapidjson;

Document JsonHasElopage::handle(const Document& params)
{
	auto result = checkAndLoadSession(params);
	if (result.IsObject()) {
		return result;
	}
	auto elopage_buy = Poco::AutoPtr<model::table::ElopageBuy>(new model::table::ElopageBuy);
	
	result = stateSuccess();
	auto alloc = result.GetAllocator();
	result.AddMember("hasElopage", elopage_buy->isExistInDB("payer_email", mSession->getNewUser()->getModel()->getEmail()), alloc);

	return result;
}