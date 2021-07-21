#include "JsonNetworkInfos.h"

#include "../controller/Group.h"

using namespace rapidjson;

Document JsonNetworkInfos::handle(const Document& params)
{
	auto paramError = checkArrayParameter(params, "ask");
	if(paramError.IsObject()) { return paramError; }
	auto itr = params.FindMember("ask");
	const Value& ask = itr->value;

	Document result(kObjectType);
	auto alloc = result.GetAllocator();

	Value jsonNetworkInfos(kArrayType);

	for (auto it = ask.Begin(); it != ask.End(); it++)
	{
		if (!it->IsString()) {
			return rstateError("ask array member isn't a string");
		}
		std::string parameterString(it->GetString(), it->GetStringLength());
		if (parameterString == "groups") {
			auto groups = controller::Group::listAll();
			Value json_groups(kArrayType);
			for (auto it = groups.begin(); it != groups.end(); it++) {
				auto group_model = (*it)->getModel();
				json_groups.PushBack(Value(group_model->getAlias().data(), alloc), alloc);
			}
			jsonNetworkInfos.AddMember("groups", json_groups, alloc);
		}
	}

	result.AddMember("state", "success", alloc);
	result.AddMember("data", jsonNetworkInfos, alloc);

	return result;
}
