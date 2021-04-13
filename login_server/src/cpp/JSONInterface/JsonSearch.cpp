#include "JsonSearch.h"

#include "../lib/DataTypeConverter.h"
#include "../controller/User.h"
#include "../SingletonManager/SessionManager.h"

Poco::JSON::Object* JsonSearch::handle(Poco::Dynamic::Var params)
{
	/*
		'ask' = ['account_publickey' => '<email_blake2b_base64>']
	*/
	// incoming
	
	Poco::JSON::Object::Ptr ask;

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			ask = paramJsonObject->getObject("ask");
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}

	
	if (ask.isNull()) {
		return stateError("ask is zero or not an object");
	}


	Poco::JSON::Object* result = new Poco::JSON::Object;
	result->set("state", "success");
	Poco::JSON::Array  jsonErrorsArray;
	Poco::JSON::Object result_fields;
	auto sm = SessionManager::getInstance();
	auto mm = MemoryManager::getInstance();
	for (auto it = ask->begin(); it != ask->end(); it++) {
		std::string name = it->first;
		auto value = it->second;


		try {
			if ("account_publickey" == name) {
				if (!value.isString()) {
					jsonErrorsArray.add("account_publickey isn't a string");
				}
				else {
					MemoryBin* email_hash = nullptr;
					if (sm->isValid(value, VALIDATE_ONLY_HEX)) {
						email_hash = DataTypeConverter::hexToBin(value);
					}
					if (!email_hash) {
						email_hash = DataTypeConverter::base64ToBin(value);
					}
					if (!email_hash) {
						jsonErrorsArray.add("account_publickey isn't valid base64 or hex");
					}
					else {
						auto user = controller::User::create();
						user->load(email_hash);
						mm->releaseMemory(email_hash);
						auto user_model = user->getModel();
						auto public_key_base64 = DataTypeConverter::binToBase64(user_model->getPublicKey(), user_model->getPublicKeySize());
						result_fields.set("account_publickey", public_key_base64);
					}
				}
			}
		}
		catch (Poco::Exception& ex) {
			jsonErrorsArray.add("update parameter invalid");
		}
	}
	
	result->set("errors", jsonErrorsArray);
	result->set("results", result_fields);
	result->set("state", "success");

	return result;
}