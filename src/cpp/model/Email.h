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

#include "../controller/EmailVerificationCode.h"
#include "../controller/User.h"

#include "../SingletonManager/LanguageManager.h"

#include "../lib/ErrorList.h"

namespace model {
	using namespace Poco;

	enum EmailType 
	{
		EMAIL_DEFAULT,
		EMAIL_ERROR,
		EMAIL_USER_VERIFICATION_CODE,
		EMAIL_USER_RESET_PASSWORD,
		EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE
	};

	class Email: public ErrorList
	{
	public:
		Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type);
		Email(AutoPtr<controller::User> user, EmailType type);
		//! \param errors copy errors into own memory
		Email(const std::string& errorHtml, EmailType type);
		~Email();

		inline EmailType getType() { return mType; }
		inline controller::User* getUser() { if (!mUser.isNull()) return mUser.get(); return nullptr; }

		bool draft(Net::MailMessage* mailMessage, LanguageCatalog* langCatalog);
		inline void addContent(Poco::Net::StringPartSource* str_content) { mAdditionalStringPartSrcs.push(str_content); }

	protected:
		std::string replaceUserNamesAndLink(const char* src, const std::string& first_name, const std::string& last_name, const std::string& link);
		std::string replaceEmail(const char* src, const std::string& email);

		AutoPtr<controller::EmailVerificationCode> mEmailVerificationCode;
		AutoPtr<controller::User> mUser;
		std::string mErrorHtml;
		EmailType mType;

		std::queue<Poco::Net::StringPartSource*> mAdditionalStringPartSrcs;
	};
}

#endif //GRADIDO_LOGIN_SERVER_MODEL_EMAIL_INCLUDE