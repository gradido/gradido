#include "JsonCheckUsername.h"
#include "Poco/URI.h"
#include "controller/User.h"
#include "lib/DataTypeConverter.h"

Poco::JSON::Object* JsonCheckUsername::handle(Poco::Dynamic::Var params)
{
	std::string username;
	int group_id = 0;
	std::string group_alias;

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		
		auto username_obj = paramJsonObject->get("username");
		auto group_id_obj = paramJsonObject->get("group_id");
		auto group_alias_obj = paramJsonObject->get("group_alias");

		try {
			
			if (!username_obj.isEmpty()) {
				username_obj.convert(username);
			}

			if (!group_id_obj.isEmpty()) {
				group_id_obj.convert(group_id);
			}
			if (!group_alias_obj.isEmpty()) {
				group_alias_obj.convert(group_alias);
			}

		}
		catch (Poco::Exception& ex) {
			return stateError("Poco Exception", ex.displayText());
		}
		
	}
	else if (params.isVector()) {
		const Poco::URI::QueryParameters queryParams = params.extract<Poco::URI::QueryParameters>();
		for (auto it = queryParams.begin(); it != queryParams.end(); it++) {
			if (it->first == "username") {
				username = it->second;
			}
			else if (it->first == "group_id") {
				DataTypeConverter::strToInt(it->second, group_id);
			}
			else if (it->first == "group_alias") {
				group_alias = it->second;
			}
		}
	}
	else {
		return stateError("format not implemented", std::string(params.type().name()));
	}
	
	if (!group_id && group_alias == "") {
		return stateError("no group given");
	}
	if (!group_id) {
		auto groups = controller::Group::load(group_alias);
		if (groups.size() > 1) {
			return stateError("group is ambiguous");
		}
		if (!groups.size()) {
			return stateError("unknown group");
		}
		group_id = groups[0]->getModel()->getID();
	}
	auto group = controller::Group::load(group_id);
	if (group.isNull()) {
		return stateError("unknown group");
	}
	auto user = controller::User::create();
	user->getModel()->setGroupId(group_id);
	if (username == "") {
		Poco::JSON::Object* result = new Poco::JSON::Object;
		result->set("state", "success");
		result->set("group_id", group_id);
		return result;
	}
	if (user->isUsernameAlreadyUsed(username)) {
		return stateWarning("username already in use");
	}
	return stateSuccess();

}