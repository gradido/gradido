#include "JsonSignTransaction.h"
#include "lib/DataTypeConverter.h"

Poco::JSON::Object* JsonSignTransaction::handle(Poco::Dynamic::Var params)
{
	auto result = checkAndLoadSession(params);
	if (result) {
		return result;
	}

	std::string bodyBytes_base64;
	auto mm = MemoryManager::getInstance();

	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("bodyBytes").convert(bodyBytes_base64);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	auto user = mSession->getNewUser();
	auto keyPair = user->getGradidoKeyPair();
	if (!keyPair) {
		return stateError("error reading keys");
	}

	auto bodyBytes = DataTypeConverter::base64ToBin(bodyBytes_base64);
	auto sign = keyPair->sign(bodyBytes_base64);
	mm->releaseMemory(bodyBytes);
	
	if (!sign) {
		return stateError("error signing transaction");
	}
	auto sign_base64 = DataTypeConverter::binToBase64(sign);
	mm->releaseMemory(sign);
	result = stateSuccess();
	result->set("sign", sign_base64);

	return result;
}