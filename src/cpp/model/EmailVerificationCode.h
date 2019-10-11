#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE

#define EMAIL_VERIFICATION_CODE_SIZE 8

#include "ModelBase.h"
#include "Poco/Types.h"


class EmailVerificationCode : public ModelBase
{
public:
	EmailVerificationCode(int user_id);
	EmailVerificationCode();
	~EmailVerificationCode();

	// generic db operations
	const char* getTableName() { return "email_opt_in"; }
	Poco::Data::Statement insertIntoDB(Poco::Data::Session session);
	Poco::Data::Statement updateIntoDB(Poco::Data::Session session);
	Poco::Data::Statement loadFromDB(Poco::Data::Session session, std::string& fieldName);
	

	inline Poco::UInt64 getCode() const { return mEmailVerificationCode; }
protected:
	void createEmailVerificationCode();

	// data type must be a multiple of 4
	Poco::UInt64 mEmailVerificationCode;
	int			 mUserId;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_VERIFICATION_CODE_INCLUDE