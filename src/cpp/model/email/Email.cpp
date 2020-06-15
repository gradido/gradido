#include "Email.h"
#include "../../SingletonManager/EmailManager.h"

#include "Poco/Net/MediaType.h"

#include "../TransactionBase.h"

#include "../lib/DataTypeConverter.h"

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

const static char EmailText_emailVerificationResend[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Du oder jemand anderes hat sich vor 7 Tagen mit dieser E-Mail Adresse bei Gradido registriert.\n\
Wenn du es warst, klicke bitte auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
" };

const static char EmailText_emailVerificationResendAfterLongTime[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Du oder jemand anderes hat sich vor [duration] mit dieser E-Mail Adresse bei Gradido registriert.\n\
Wenn du es warst, klicke bitte auf den Link: [link] um dein Konto zu aktivieren\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
" };

const static char EmailText_emailVerificationOldElopageTransaction[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Da wir Dir für Deine Beiträge GradidoTransform gutschreiben und\n\
Du bisher noch kein Gradido-Konto hattest, haben wir eines für Dich eröffnet.\n\
\n\
Um es zu aktivieren klicke bitte auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Wenn Du momentan kein Gradido-Konto haben möchtest, kannst Du diese E-Mail auch einfach ignorieren.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
" };

const static char EmailText_adminEmailVerification[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Der Admin hat soeben ein Gradido Konto für dich mit dieser E-Mail angelegt.\n\
Bitte klicke zur Bestätigung auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
"};

const static char EmailText_adminEmailVerificationResend[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Der Admin hat ein erneutes zusenden deiner Bestätigungsemail angefordert. \n\
Du hast vor einer Weile ein Gradido Konto mit dieser E-Mail angelegt, aber es noch nicht bestätigt. \n\
\n\
Bitte klicke zur Bestätigung auf den Link: [link]\n\
oder kopiere den obigen Link in Dein Browserfenster.\n\
\n\
Mit freundlichen Grüßen\n\
Dario, Gradido Server Admin\n\
" };



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

const static char EmailText_notificationTransactionCreation[] = { u8"\
Hallo [first_name] [last_name],\n\
\n\
Für dich wurden soeben [amount] GDD geschöpft.\n\
\n\
Bitte antworte nicht auf diese E-Mail\n\
\n\
Mit freundlichen Grüßen\n\
Gradido Login-Server\n\
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

		const char* messageTemplate = nullptr;
		std::string content_string;

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
		case EMAIL_USER_VERIFICATION_CODE_RESEND:
		case EMAIL_USER_VERIFICATION_CODE_RESEND_AFTER_LONG_TIME:
		case EMAIL_USER_REGISTER_OLD_ELOPAGE:
		case EMAIL_ADMIN_USER_VERIFICATION_CODE:
		case EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND:
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

			messageTemplate = EmailText_emailVerification;
			if (EMAIL_USER_VERIFICATION_CODE_RESEND == mType) {
				messageTemplate = EmailText_emailVerificationResend;
			}
			else if (EMAIL_USER_VERIFICATION_CODE_RESEND_AFTER_LONG_TIME == mType) {
				messageTemplate = EmailText_emailVerificationResendAfterLongTime;
			}
			else if (mType == EMAIL_ADMIN_USER_VERIFICATION_CODE) {
				messageTemplate = EmailText_adminEmailVerification;
			}
			else if (mType == EMAIL_ADMIN_USER_VERIFICATION_CODE_RESEND) {
				messageTemplate = EmailText_adminEmailVerificationResend;
			}
			else if (mType == EMAIL_USER_REGISTER_OLD_ELOPAGE) {
				messageTemplate = EmailText_emailVerificationOldElopageTransaction;
			}

			content_string = replaceUserNamesAndLink(
				langCatalog->gettext(messageTemplate),
				userTableModel->getFirstName(),
				userTableModel->getLastName(),
				mEmailVerificationCode->getLink()
			);
			if (EMAIL_USER_VERIFICATION_CODE_RESEND_AFTER_LONG_TIME == mType) {
				content_string = replaceDuration(content_string, mEmailVerificationCode->getAge(), langCatalog);
			}
			mailMessage->addContent(new Poco::Net::StringPartSource(content_string, mt.toString()));

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
			//addError(new Error(functionName, "no email placeholder found"));
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

	std::string Email::replaceAmount(const char* src, Poco::Int64 gradido_cent)
	{
		std::string result = src;
		static const char* functionName = "Email::replaceAmount";
		int findPos = result.find("[amount]");
		if (findPos != result.npos) {
			result.replace(findPos, 8, TransactionBase::amountToString(gradido_cent));
		}
		else {
			addError(new Error(functionName, "no amount placeholder found"));
		}
		return result;
	}

	std::string Email::replaceDuration(std::string src, Poco::Timespan duration, LanguageCatalog* lang)
	{
		static const char* functionName = "Email::replaceDuration";
		int findPos = src.find("[duration]");
		if (findPos != src.npos) {
			src.replace(findPos, 10, DataTypeConverter::convertTimespanToLocalizedString(duration, lang));
		}
		else {
			addError(new Error(functionName, "no duration placeholder found"));
		}
		return src;
	}

	EmailType Email::convertTypeFromInt(int type)
	{
		if (type >= (int)EMAIL_MAX || type <= 0) {
			return EMAIL_ERROR;
		}
		return (EmailType)type;
	}
}