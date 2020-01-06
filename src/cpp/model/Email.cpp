#include "Email.h"
#include "../SingletonManager/EmailManager.h"

#include "Poco/Net/MediaType.h"

namespace model {

const static char EmailText_emailVerification[] = {u8"\
Hallo [first_name] [last_name],\n\
\n\
Du oder jemand anderes hat sich soeben mit dieser E-Mail Adresse bei Gradido registriert.\n\
Wenn du es warst, klicke bitte auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
"};

const static char EmailText_emailResetPassword[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Du oder jemand anderes hat für dieses Konto ein Passwort Reset angefordert.\n\
Wenn du es warst, klicke bitte auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
" };

const static char EmailText_adminEmailResetPassword[] = { u8"\
Der Benutzer mit der Email-Adresse: [email] hat sein Passwort vergessen.\n\
Außerdem hat er auch seine Passphrase vergessen. \n\
Bitte logge dich im Admin-Bereich um das Problem zu lösen.\n\
\n\
LG \n\
Gradido Login Server\
" };

	Email::Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type)
		: mEmailVerificationCode(emailVerification), mUser(user),  mType(type)
	{

	}


	Email::Email(const std::string& errorHtml, EmailType type)
		: mErrorHtml(errorHtml), mType(type)
	{
	}

	Email::Email(AutoPtr<controller::User> user, EmailType type)
		: mUser(user), mType(type)
	{

	}

	Email::~Email()
	{
		while (mAdditionalStringPartSrcs.size() > 0) {
			delete mAdditionalStringPartSrcs.front();
			mAdditionalStringPartSrcs.pop();
		}
	}


	bool Email::draft(Net::MailMessage* mailMessage, LanguageCatalog* langCatalog)
	{
		auto em = EmailManager::getInstance();
		auto adminRecipient = Net::MailRecipient(Net::MailRecipient::PRIMARY_RECIPIENT, em->getAdminReceiver());
		Poco::AutoPtr<model::table::User> userTableModel;
		if (!mUser.isNull()) {
			userTableModel = mUser->getModel();
		}
		static const char* functionName = "Email::draft";
		std::string content;

		Poco::Net::MediaType mt("text", "plain");
		mt.setParameter("charset", "utf-8");

		switch (mType) {
		case EMAIL_DEFAULT: 
			mailMessage->addRecipient(adminRecipient);
			mailMessage->setSubject(langCatalog->gettext_str("Default Email Subject"));
			mailMessage->addContent(new Poco::Net::StringPartSource(langCatalog->gettext_str("Empty Email Content"), mt.toString()));
			break;

		case EMAIL_ERROR:
			mailMessage->addRecipient(adminRecipient);
			mailMessage->setSubject(langCatalog->gettext_str("Error from Gradido Login Server"));
			mailMessage->addContent(new Poco::Net::StringPartSource(mErrorHtml, mt.toString()));
			break;
		
		case EMAIL_USER_VERIFICATION_CODE:
			if (userTableModel.isNull() || mUser->getModel()->getEmail() == "") {
				addError(new Error(functionName, "no receiver email set for user email verification email"));
				return false;
			}
			if (mEmailVerificationCode.isNull()) {
				addError(new Error(functionName, "no email verification code set for user email verification email"));
				return false;
			}
			mailMessage->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, mUser->getModel()->getEmail()));
			mailMessage->setSubject(langCatalog->gettext_str("Gradido: E-Mail Verification"));

			mailMessage->addContent(
				new Poco::Net::StringPartSource(replaceUserNamesAndLink(
					langCatalog->gettext(EmailText_emailVerification),
					userTableModel->getFirstName(), 
					userTableModel->getLastName(),
					mEmailVerificationCode->getLink()
				), mt.toString())
			);
			break;
		case EMAIL_USER_RESET_PASSWORD:
			if (userTableModel.isNull() || mUser->getModel()->getEmail() == "") {
				addError(new Error(functionName, "no receiver email set for user reset password email"));
				return false;
			}
			if (mEmailVerificationCode.isNull()) {
				addError(new Error(functionName, "no email verification code set for user reset password email"));
				return false;
			}
			mailMessage->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, mUser->getModel()->getEmail()));
			mailMessage->setSubject(langCatalog->gettext_str(u8"Gradido: Passwort zurücksetzen"));

			mailMessage->addContent(
				new Poco::Net::StringPartSource(replaceUserNamesAndLink(
					langCatalog->gettext(EmailText_emailResetPassword),
					userTableModel->getFirstName(),
					userTableModel->getLastName(),
					mEmailVerificationCode->getLink()
				), mt.toString())
			);
			break;
		case EMAIL_ADMIN_RESET_PASSWORD_REQUEST_WITHOUT_MEMORIZED_PASSPHRASE:
			if (userTableModel.isNull() || mUser->getModel()->getEmail() == "") {
				addError(new Error(functionName, "no user email set for admin reset password email"));
				return false;
			}

			mailMessage->addRecipient(adminRecipient);
			mailMessage->setSubject(langCatalog->gettext_str("Reset Password Request without memorized passphrase"));
			mailMessage->addContent(
				new Poco::Net::StringPartSource(replaceEmail(
					EmailText_adminEmailResetPassword,
					userTableModel->getEmail()
				), mt.toString())
			);
			break;
		default: return false;
		}

		while (mAdditionalStringPartSrcs.size() > 0) {
			mailMessage->addContent(mAdditionalStringPartSrcs.front());
			mAdditionalStringPartSrcs.pop();
		}

		return true;
	}

	std::string Email::replaceUserNamesAndLink(const char* src, const std::string& first_name, const std::string& last_name, const std::string& link)
	{
		std::string result = src;
		int findCursor = 0;
		static const char* functionName = "Email::replaceUserNamesAndLink";

		int findPos = result.find("[first_name]", findCursor);
		if (findPos != result.npos) {
			findCursor = findPos + first_name.size();
			result.replace(findPos, 12, first_name);
		}
		else {
			addError(new Error(functionName, "no first_name placeholder found"));
		}
		
		findPos = result.find("[last_name]", findCursor);
		if (findPos != result.npos) {
			findCursor = findPos + last_name.size();
			result.replace(findPos, 11, last_name);
		}
		else {
			addError(new Error(functionName, "no last_name placeholder found"));
		}

		findPos = result.find("[link]", findCursor);
		if (findPos != result.npos) {
			findCursor = findPos + link.size();
			result.replace(findPos, 6, link);
		}
		else {
			addError(new Error(functionName, "no email placeholder found"));
		}
		return result;
	}

	std::string Email::replaceEmail(const char* src, const std::string& email)
	{
		std::string result = src;
		static const char* functionName = "Email::replaceEmail";

		int findPos = result.find("[email]");
		if (findPos != result.npos) {
			result.replace(findPos, 7, email);
		}
		else {
			addError(new Error(functionName, "no email placeholder found"));
		}
		return result;
	}
}