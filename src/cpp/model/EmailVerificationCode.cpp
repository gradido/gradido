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

/*
Poco::Data::Statement select(session);
int email_checked = 0;
select << "SELECT email, first_name, last_name, password, pubkey, email_checked from users where id = ?",
into(mEmail), into(mFirstName), into(mLastName), into(mPasswordHashed), into(pubkey), into(email_checked), use(user_id);
try {
auto result = select.execute();
int zahl = 1;
if (result == 1) {

if (!pubkey.isNull()) {
auto pubkey_value = pubkey.value();
size_t hexSize = pubkey_value.size() * 2 + 1;
char* hexString = (char*)malloc(hexSize);
memset(hexString, 0, hexSize);
sodium_bin2hex(hexString, hexSize, pubkey_value.content().data(), pubkey_value.size());
mPublicHex = hexString;
free(hexString);
}
if (email_checked != 0) mEmailChecked = true;
}
}
catch (Poco::Exception& ex) {
addError(new ParamError("User::User", "mysql error", ex.displayText().data()));
}
*/