#include "JsonCheckUsername.h"
#include "controller/User.h"

#include "rapidjson/document.h"

using namespace rapidjson;

Document JsonCheckUsername::handle(const Document& params)
{
	std::string username;
	int group_id = 0;
	std::string group_alias;

	for (auto it = params.MemberBegin(); it != params.MemberEnd(); it++) {
		auto name = it->name.GetString();
		if (it->value.IsString()) {
			if (strcmp(name, "username") == 0) {
				username = it->value.GetString();
			}
			else if (strcmp(name, "group_alias") == 0) {
				group_alias = it->value.GetString();
			}
		}
		else if (it->value.IsInt()) {
			if (strcmp(name, "group_id") == 0) {
				group_id = it->value.GetInt();
			}
		}
	}
	
	if (!group_id && group_alias == "") {
		return rstateError("no group given");
	}
	if (!group_id) {
		auto groups = controller::Group::load(group_alias);
		if (groups.size() > 1) {
			return rstateError("group is ambiguous");
		}
		if (!groups.size()) {
			return rstateError("unknown group");
		}
		group_id = groups[0]->getModel()->getID();
	}
	auto group = controller::Group::load(group_id);
	if (group.isNull()) {
		return rstateError("unknown group");
	}
	auto user = controller::User::create();
	user->getModel()->setGroupId(group_id);
	if (username == "") {
		Document result(kObjectType);
		
		result.AddMember("state", "success", result.GetAllocator());
		result.AddMember("group_id", group_id, result.GetAllocator());
		return result;
	}
	if (user->isUsernameAlreadyUsed(username)) {
		return rstateWarning("username already in use");
	}
	return rstateSuccess();

}