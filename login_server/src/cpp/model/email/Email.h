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

#include "../../lib/NotificationList.h"

namespace model {
	using namespace Poco;

	enum EmailType
	{
		EMAIL_DEFAULT = 0,
		EMAIL_ERROR = 1,
		EMAIL_USER_VERIFICATION_CODE = 2,
		EMAIL_USER_VERIFICATION_CODE_RESEND = 3,
		EMAIL_USER_VERIFICATION_CODE_RESEND_AFTER_LONG_TIME = 4,
		EMAIL_ADMIN_USER_VERIFICATION_CODE = 5,
		EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND = 6,
		EMAIL_USER_RESET_PASSWORD = 7,
		EMAIL_CUSTOM_TEXT = 8,
		EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE = 9,
		EMAIL_USER_REGISTER_OLD_ELOPAGE = 10,
		EMAIL_MAX = 11
	};

	class Email: public NotificationList
	{
	public:
		Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type);
		Email(AutoPtr<controller::User> user, EmailType type);
		Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, const std::string& emailCustomText, const std::string& customSubject);
		//! \param errors copy errors into own memory
		Email(const std::string& errorHtml, EmailType type);
		~Email();

		static EmailType convertTypeFromInt(int type);
		inline EmailType getType() { return mType; }
		static const char* emailTypeString(EmailType type);
		static EmailType emailType(const std::string& emailTypeString);
		inline controller::User* getUser() { if (!mUser.isNull()) return mUser.get(); return nullptr; }

		virtual bool draft(Net::MailMessage* mailMessage, LanguageCatalog* langCatalog);
		inline void addContent(Poco::Net::StringPartSource* str_content) { mAdditionalStringPartSrcs.push(str_content); }


	protected:
		std::string replaceUserNamesAndLink(const char* src, const std::string& first_name, const std::string& last_name, const std::string& link, Poco::UInt64 code);
		std::string replaceEmail(const char* src, const std::string& email);
		std::string replaceAmount(const char* src, Poco::Int64 gradido_cent);
		std::string replaceDuration(std::string src, Poco::Timespan duration, LanguageCatalog* lang);

		AutoPtr<controller::EmailVerificationCode> mEmailVerificationCode;
		AutoPtr<controller::User> mUser;
		std::string mErrorHtml;
		EmailType mType;

		std::queue<Poco::Net::StringPartSource*> mAdditionalStringPartSrcs;
		std::string     mCustomText;
		std::string     mCustomSubject;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE
