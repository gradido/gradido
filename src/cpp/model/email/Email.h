/*!
*
* \author: einhornimmond
*
* \date: 02.01.20
*
* \brief: store email for 
*/

#ifndef GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE

#include "Poco/Net/MailMessage.h"

#include "../../controller/EmailVerificationCode.h"
#include "../../controller/User.h"

#include "../../SingletonManager/LanguageManager.h"

#include "../../lib/ErrorList.h"

namespace model {
	using namespace Poco;

	enum EmailType 
	{
		EMAIL_DEFAULT = 1,
		EMAIL_ERROR = 2,
		EMAIL_USER_VERIFICATION_CODE = 3,
		EMAIL_ADMIN_USER_VERIFICATION_CODE = 4,
		EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND = 5,
		EMAIL_USER_RESET_PASSWORD = 6,
		EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE = 7,
		EMAIL_NOTIFICATION_TRANSACTION_CREATION = 8,
		EMAIL_NOTIFICATION_TRANSACTION_TRANSFER = 9,
		EMAIL_USER_REGISTER_OLD_ELOPAGE = 10,
		EMAIL_MAX = 11
	};

	class Email: public ErrorList
	{
	public:
		Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type);
		Email(AutoPtr<controller::User> user, EmailType type);
		//! \param errors copy errors into own memory
		Email(const std::string& errorHtml, EmailType type);
		~Email();

		static EmailType convertTypeFromInt(int type);
		inline EmailType getType() { return mType; }
		inline controller::User* getUser() { if (!mUser.isNull()) return mUser.get(); return nullptr; }

		virtual bool draft(Net::MailMessage* mailMessage, LanguageCatalog* langCatalog);
		inline void addContent(Poco::Net::StringPartSource* str_content) { mAdditionalStringPartSrcs.push(str_content); }

	protected:
		std::string replaceUserNamesAndLink(const char* src, const std::string& first_name, const std::string& last_name, const std::string& link);
		std::string replaceEmail(const char* src, const std::string& email);
		std::string replaceAmount(const char* src, Poco::Int64 gradido_cent);

		AutoPtr<controller::EmailVerificationCode> mEmailVerificationCode;
		AutoPtr<controller::User> mUser;
		std::string mErrorHtml;
		EmailType mType;

		std::queue<Poco::Net::StringPartSource*> mAdditionalStringPartSrcs;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE