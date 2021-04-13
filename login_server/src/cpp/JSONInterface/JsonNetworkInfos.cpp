#include "JsonNetworkInfos.h"

#include "../controller/Group.h"

Poco::JSON::Object* JsonNetworkInfos::handle(Poco::Dynamic::Var params)
{
	/*
		'ask' => ['groups']
	*/
	// incoming
	
	Poco::JSON::Array::Ptr askArray;

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			askArray = paramJsonObject->getArray("ask");
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	
	if (askArray.isNull()) {
		return stateError("ask is zero or not an array");
	}


	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	Poco::JSON::Array  jsonErrorsArray;
	Poco::JSON::Object json_network_infos;

	for (auto it = askArray->begin(); it != askArray->end(); it++) {
		auto parameter = *it;
		std::string parameterString;
		try {
			parameter.convert(parameterString);
			if (parameterString == "groups") {
				auto groups = controller::Group::listAll();
				Poco::JSON::Array json_groups;
				for (auto it = groups.begin(); it != groups.end(); it++) {
					auto group_model = (*it)->getModel();
					json_groups.add(group_model->getAlias());
				}
				json_network_infos.set("groups", json_groups);
			}
			
		}
		catch (Poco::Exception& ex) {
			jsonErrorsArray.add("ask parameter invalid");
		}
	}
	result->set("errors", jsonErrorsArray);
	result->set("data", json_network_infos);
	return result;

}