#include "EmailVerificationCode.h"
#include "../ServerConfig.h"

#include "sodium.h"

namespace controller {

	EmailVerificationCode::EmailVerificationCode(model::table::EmailOptIn* dbModel)
	{
		mDBModel = dbModel;
	}

	EmailVerificationCode::~EmailVerificationCode()
	{

	}

	/*
	Poco::AutoPtr<table::EmailOptIn> EmailVerificationCode::getModel()
	{
		lock("EmailVerificationCode::getModel");
		table::EmailOptIn* result = static_cast<table::EmailOptIn*>(mDBModel.get());
		unlock();
		return Poco::AutoPtr<table::EmailOptIn>(result, true);
	}
	*/

	//  ---------------   static members ----------------------------- 

	Poco::AutoPtr<EmailVerificationCode> EmailVerificationCode::create(int user_id, model::table::EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
	{
		auto code = createEmailVerificationCode();
		auto db = new model::table::EmailOptIn(code, user_id, type);
		return Poco::AutoPtr<EmailVerificationCode>(new EmailVerificationCode(db));
	}

	Poco::AutoPtr<EmailVerificationCode> EmailVerificationCode::create(model::table::EmailOptInType type/* = EMAIL_OPT_IN_REGISTER*/)
	{
		auto code = createEmailVerificationCode();
		auto db = new model::table::EmailOptIn(code, type);
		return Poco::AutoPtr<EmailVerificationCode>(new EmailVerificationCode(db));
	}

	Poco::AutoPtr<EmailVerificationCode> EmailVerificationCode::load(Poco::UInt64 code)
	{ 
		auto db = new model::table::EmailOptIn();
		if (db->loadFromDB("verification_code", code) == 1) {
			return Poco::AutoPtr<EmailVerificationCode>(new EmailVerificationCode(db));
		}
		db->release();
		return nullptr;
	}

	Poco::AutoPtr<EmailVerificationCode> EmailVerificationCode::load(int user_id, model::table::EmailOptInType type) {
		auto db = new model::table::EmailOptIn();
		std::vector<std::string> fields = { "user_id", "email_opt_in_type_id" };
		if (db->loadFromDB(fields, user_id, (int)type) == 1) {
			return Poco::AutoPtr<EmailVerificationCode>(new EmailVerificationCode(db));
		}
		db->release();
		return nullptr;
	}

	std::vector<Poco::AutoPtr<EmailVerificationCode>> EmailVerificationCode::load(int user_id)
	{
		auto db = new model::table::EmailOptIn();
		auto results = db->loadFromDB<int, model::table::EmailOptInTuple>("user_id", user_id, 2);
		
		std::vector<Poco::AutoPtr<EmailVerificationCode>> resultObjects;
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
			resultObjects.push_back(new EmailVerificationCode(new model::table::EmailOptIn(*it)));
		}

		return resultObjects;

	}
	
	Poco::UInt64 EmailVerificationCode::createEmailVerificationCode()
	{
		Poco::UInt64 resultCode;
		uint32_t* code_p = (uint32_t*)&resultCode;
		for (int i = 0; i < sizeof(resultCode) / 4; i++) {
			code_p[i] = randombytes_random();
		}
		return resultCode;
	}

	std::string EmailVerificationCode::getLink()
	{
		std::string link = ServerConfig::g_serverPath;
		link += "/checkEmail/";
		link += std::to_string(getModel()->getCode());
		return link;
	}


}