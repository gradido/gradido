#include "AppAccessToken.h"

#include "sodium.h"

namespace controller
{
	AppAccessToken::AppAccessToken(model::table::AppAccessToken* dbModel)
	{
		mDBModel = dbModel;
	}

	AppAccessToken::~AppAccessToken()
	{

	}

	Poco::AutoPtr<AppAccessToken> AppAccessToken::create(int user_id)
	{
		auto code = createAppAccessCode();
		auto db = new model::table::AppAccessToken(code, user_id);
		return Poco::AutoPtr<AppAccessToken>(new AppAccessToken(db));
	}

	Poco::AutoPtr<AppAccessToken> AppAccessToken::load(const Poco::UInt64& code)
	{
		auto db = new model::table::AppAccessToken();
		if (db->loadFromDB("app_access_tokens", code) == 1) {
			return Poco::AutoPtr<AppAccessToken>(new AppAccessToken(db));
		}
		db->release();
		return nullptr;
	}

	std::vector<Poco::AutoPtr<AppAccessToken>> AppAccessToken::load(int user_id)
	{
		auto db = new model::table::AppAccessToken();
		auto results = db->loadFromDB<int, model::table::AppAccessCodeTuple>("user_id", user_id, 2);

		std::vector<Poco::AutoPtr<AppAccessToken>> resultObjects;
		if (db->errorCount()) {
			db->sendErrorsAsEmail();
			db->release();
			return resultObjects;
		}
		db->release();
		if (results.size() == 0) {
			return resultObjects;
		}
		for (auto it = results.begin(); it != results.end(); it++) {
			resultObjects.push_back(new AppAccessToken(new model::table::AppAccessToken(*it)));
		}

		return resultObjects;
	}

	Poco::UInt64 AppAccessToken::createAppAccessCode()
	{
		Poco::UInt64 resultCode;
		uint32_t* code_p = (uint32_t*)&resultCode;
		for (int i = 0; i < sizeof(resultCode) / 4; i++) {
			code_p[i] = randombytes_random();
		}
		return resultCode;
	}
}