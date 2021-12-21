#include "EmailManager.h"
#include "../ServerConfig.h"

#include "../Crypto/Obfus_array.h"
#include "../Crypto/DRRandom.h"

#include "../SingletonManager/LanguageManager.h"

#include "Poco/Net/SecureSMTPClientSession.h"
#include "Poco/Net/SSLException.h"


EmailManager::EmailManager()
	: Thread("emails", false), mEmailLog(Poco::Logger::get("emailLog")), mInitalized(false), mDisableEmail(false)
{


}

EmailManager::~EmailManager()
{
	exit();
	
}

EmailManager* EmailManager::getInstance()
{
	static EmailManager theOne;
	return &theOne;
}

bool EmailManager::init(const Poco::Util::LayeredConfiguration& cfg)
{
	try {
		mDisableEmail = cfg.getBool("email.disable", false);
		if (!mDisableEmail) {
			mEmailAccount.sender = cfg.getString("email.sender");
			mEmailAccount.admin_receiver = cfg.getString("email.admin_receiver");
			mEmailAccount.username = cfg.getString("email.username");
			mEmailAccount.password = cfg.getString("email.password");
			mEmailAccount.url = cfg.getString("email.smtp.url");
			mEmailAccount.port = cfg.getInt("email.smtp.port");
		}
	}
	catch (Poco::Exception& ex) {
		printf("email account not set in config: %s\n", ex.displayText().data());
		return false;
	}
	Thread::init("emails");
	mInitalized = true;

	DISASM_FALSERET;
	ServerConfig::g_ServerKeySeed->put(3, DRRandom::r64());

	return true;
}

void EmailManager::addEmail(model::Email* email) {
	if (mDisableEmail) { 
		std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
		std::string log_message = dateTimeString + " Email should have been sent to: ";
		auto email_user = email->getUser();
		Poco::AutoPtr<model::table::User> email_model;
		if (email_user) {
			email_model = email_user->getModel();
			log_message += email_model->getNameWithEmailHtml();
		}
		if (email_model.isNull()) {
			log_message += "<missing>";
		}
		log_message += ", type: ";
		log_message += model::Email::emailTypeString(email->getType());
		mEmailLog.log(log_message);
		
		delete email; 
		return; 
	}
	mPendingEmails.push(email); 
	condSignal();
}

void EmailManager::exit()
{
	model::Email* email = nullptr;
	while (mPendingEmails.pop(email)) {
		delete email;
	}
	mInitalized = false;
}

int EmailManager::ThreadFunction()
{
	// prepare connection to email server
	if (ServerConfig::g_disableEmail) return 0;
	
	if (mPendingEmails.empty()) return 0;

	auto lm = LanguageManager::getInstance();
	NotificationList errors;
	static const char* function_name = "PrepareEmailTask";

	Poco::Net::SecureSMTPClientSession mailClientSession(mEmailAccount.url, mEmailAccount.port);
	mailClientSession.login();
	try {
		mailClientSession.startTLS(ServerConfig::g_SSL_CLient_Context);
		mailClientSession.login(Poco::Net::SMTPClientSession::AUTH_LOGIN, mEmailAccount.username, mEmailAccount.password);
	}
	catch (Poco::Net::SSLException& ex) {
		errors.addError(new ParamError(function_name, "ssl certificate error", ex.displayText()));
		printf("[PrepareEmailTask] ssl certificate error: %s\nPlease make sure you have cacert.pem (CA/root certificates) next to binary from https://curl.haxx.se/docs/caextract.html\n", ex.displayText().data());
		return -1;
	}

	model::Email* email = nullptr;
	Poco::AutoPtr<LanguageCatalog> catalogs[2];

	// if email list empty, wait 500ms x time before exit thread and closing connection
	int timeoutWaits = 20;

	while (mPendingEmails.pop(email) || timeoutWaits > 0) {
		if (email) {
			Poco::Net::MailMessage mailMessage;
			mailMessage.setSender(mEmailAccount.sender);
			Languages lang_code = ServerConfig::g_default_locale;
			auto email_user = email->getUser();
			if (email_user) {
				Poco::AutoPtr<model::table::User> userModel = email_user->getModel();

				if (!userModel.isNull()) {
					lang_code = LanguageManager::languageFromString(userModel->getLanguageKey());
					if (lang_code > LANG_COUNT) lang_code = ServerConfig::g_default_locale;
				}
			}
			if (catalogs[lang_code].isNull()) {
				catalogs[lang_code] = lm->getFreeCatalog(lang_code);
			}
			bool email_sended = false;
			if (email->draft(&mailMessage, catalogs[lang_code])) {
				
				try {
				mailClientSession.sendMessage(mailMessage);
					email_sended = true;
				}
				catch (Poco::Net::SSLConnectionUnexpectedlyClosedException& ex) {
					// it is a mad idea to send an email if the email sending failed
					// errors.sendErrorsAsEmail();
					// better wait instead and try again, it seems that the strato mail server sometimes discard or connection
					// MAGIC NUMBER: sleep time if email sending failed (ssl connection was discarded from mailserver)
					// wait 5 minute for the next try
					Poco::Thread::sleep(5 * 60 * 1000);
					// reconnect to mailserver
					mailClientSession.login();
					try {
						mailClientSession.startTLS(ServerConfig::g_SSL_CLient_Context);
						mailClientSession.login(Poco::Net::SMTPClientSession::AUTH_LOGIN, mEmailAccount.username, mEmailAccount.password);
					}
					catch (Poco::Net::SSLException& ex) {
						errors.addError(new ParamError(function_name, "ssl certificate error", ex.displayText()));
						printf("[PrepareEmailTask] ssl certificate error: %s\nPlease make sure you have cacert.pem (CA/root certificates) next to binary from https://curl.haxx.se/docs/caextract.html\n", ex.displayText().data());
						return -1;
					}
					// retry only if not to many retries are already tried
					// MAGIC NUMBER: Retry count if email sending failed
					if (email->checkResendCounter() < 4) {
						mPendingEmails.push(email);
						email = nullptr;
						// jump back to while loop start
						continue;
					}					
				}
				catch (Poco::Exception& ex) {
					email_sended = false;
					errors.addError(new ParamError(function_name, "poco exception sending email", ex.displayText()));
					auto user = email->getUser();
					if (user && !user->getModel().isNull()) {
						errors.addError(new ParamError(function_name, "email", user->getModel()->getEmail()));
					}

					// it is a mad idea to send an email if the email sending failed
					// errors.sendErrorsAsEmail();
				}
				// add for debugging
				if (email_user) {
					//printf("send email to %s\n", user_model->getEmail().data());
					auto user_model = email_user->getModel();
					std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
					std::string log_message = dateTimeString + " Email sended to: ";
					if (!email_sended) {
						log_message = dateTimeString + " Email not sended to: ";
					}
					if (user_model) {
						log_message += email_user->getModel()->getNameWithEmailHtml();
					}
					else {
						log_message += "<missing>";
					}
					log_message += ", type: ";
					log_message += model::Email::emailTypeString(email->getType());
					mEmailLog.log(log_message);
				}
			}
			else {
				// error drafting email, shouldn't happend
				printf("[EmailManager::ThreadFunction] Error drafting email\n");
				errors.addError(new Error(function_name, "Error drafting email"));
			}
			delete email;
			email = nullptr;
		}
		if (mPendingEmails.empty()) {
			Poco::Thread::sleep(500);
			timeoutWaits--;
		}
	}
	mailClientSession.close();

	return 0;
}