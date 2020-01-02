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

	Poco::AutoPtr<EmailVerificationCode> EmailVerificationCode::create(int user_id)
	{
		auto code = createEmailVerificationCode();
		auto db = new model::table::EmailOptIn(code, user_id);
		auto result = new EmailVerificationCode(db);
		return Poco::AutoPtr<EmailVerificationCode>(result);
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