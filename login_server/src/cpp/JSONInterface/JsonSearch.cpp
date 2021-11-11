#include "JsonSearch.h"

#include "../lib/DataTypeConverter.h"
#include "../controller/User.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/CronManager.h"

using namespace rapidjson;

// TODO: monitor caller ip and allow not to much calls per second to prevent attackers using this function to check against with hundreds of email addresses
// TODO: block requester which call with to many unknown email hashes / usernames in a row
Document JsonSearch::handle(const Document& params)
{
	auto sm = SessionManager::getInstance();
	auto mm = MemoryManager::getInstance();

	auto paramError = checkObjectParameter(params, "ask");
	if (paramError.IsObject()) { return paramError; }
	auto itr = params.FindMember("ask");
	const Value& ask = itr->value;

	Document result(kObjectType);
	auto alloc = result.GetAllocator();

	Value resultFields(kObjectType);
	Value jsonErrors(kArrayType);

	for (auto it = ask.MemberBegin(); it != ask.MemberEnd(); it++)
	{
		if (!it->name.IsString()) {
			return stateError("ask array member isn't a string");
		}
		std::string ask_name(it->name.GetString(), it->name.GetStringLength());
		std::string string_value;
		if (it->value.IsString()) {
			string_value = std::string(it->value.GetString(), it->value.GetStringLength());
		}

		if (ask_name == "account_publickey") {
			auto user = controller::User::create();
			if (!string_value.size()) 
			{
				jsonErrors.PushBack("account_publickey isn't a string or empty", alloc);
			}
			else 
			{
				MemoryBin* email_hash = nullptr;
				if (sm->isValid(string_value, VALIDATE_ONLY_HEX)) {
					email_hash = DataTypeConverter::hexToBin(string_value);
				}
				if (!email_hash) {
					email_hash = DataTypeConverter::base64ToBin(string_value);
				}
				if (!email_hash) 
				{	
					if (sm->isValid(string_value, VALIDATE_USERNAME)) {
						user->load(string_value);
					} else {				
						jsonErrors.PushBack("account_publickey isn't valid base64 or hex or username", alloc);
					}
				}
				else {
					user->load(email_hash);
					mm->releaseMemory(email_hash);
				}
			}
			auto user_model = user->getModel();
			if (user_model->getID()) {
				auto public_key_base64 = DataTypeConverter::binToBase64(user_model->getPublicKey(), user_model->getPublicKeySize());
				resultFields.AddMember("account_publickey", Value(public_key_base64.data(), alloc), alloc);
				// if this was called it was maybe for a cross group transfer transaction
				// so better we ping community server to get this update in the near future
				CronManager::getInstance()->scheduleUpdateRun(Poco::Timespan(15,0));
				CronManager::getInstance()->scheduleUpdateRun(Poco::Timespan(30,0));
				CronManager::getInstance()->scheduleUpdateRun(Poco::Timespan(65,0));
			}
		}
	}

	result.AddMember("state", "success", alloc);
	result.AddMember("errors", jsonErrors, alloc);
	result.AddMember("results", resultFields, alloc);	

	return result;
}
