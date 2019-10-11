#include "EmailVerificationCode.h"

#include "sodium.h"

using namespace Poco::Data::Keywords;

EmailVerificationCode::EmailVerificationCode(int user_id)
	: mUserId(user_id), mEmailVerificationCode(0)
{
	createEmailVerificationCode();
}

EmailVerificationCode::EmailVerificationCode()
	: mUserId(0), mEmailVerificationCode(0)
{

}

EmailVerificationCode::~EmailVerificationCode()
{

}


void EmailVerificationCode::createEmailVerificationCode()
{
	uint32_t* code_p = (uint32_t*)&mEmailVerificationCode;
	for (int i = 0; i < sizeof(mEmailVerificationCode) / 4; i++) {
		code_p[i] = randombytes_random();
	}
}

Poco::Data::Statement EmailVerificationCode::insertIntoDB(Poco::Data::Session session)
{
	Poco::Data::Statement insert(session);

	lock();
	insert << "INSERT INTO " << getTableName()
		   << " (user_id, verification_code) VALUES(?,?)"
		   , bind(mUserId), bind(mEmailVerificationCode);
	unlock();
	return insert;
}

Poco::Data::Statement EmailVerificationCode::updateIntoDB(Poco::Data::Session session)
{
	throw Poco::Exception("EmailVerificationCode::updateIntoDB not implemented");
}


Poco::Data::Statement EmailVerificationCode::loadFromDB(Poco::Data::Session session, std::string& fieldName)
{
	Poco::Data::Statement select(session);

	select << "SELECT user_id, verification_code FROM " << getTableName()
		<< " where " << fieldName << " = ?"
		, into(mUserId), into(mEmailVerificationCode);

	return select;
}