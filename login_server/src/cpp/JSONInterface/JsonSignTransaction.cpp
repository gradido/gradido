#include "JsonSignTransaction.h"
#include "lib/DataTypeConverter.h"

using namespace rapidjson;

Document JsonSignTransaction::handle(const Document& params)
{
	auto result = checkAndLoadSession(params);
	if (result.IsObject()) {
		return result;
	}

	std::string bodyBytes_base64;
	result = getStringParameter(params, "bodyBytes", bodyBytes_base64);
	if (result.IsObject()) {
		return result;
	}
	auto mm = MemoryManager::getInstance();

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
	auto alloc = result.GetAllocator();
	result.AddMember("sign", Value(sign_base64.data(), alloc), alloc);

	return result;
}