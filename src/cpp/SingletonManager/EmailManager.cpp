#include "EmailManager.h"
#include "../ServerConfig.h"

#include "../Crypto/Obfus_array.h"
#include "../Crypto/DRRandom.h"

#include "../SingletonManager/LanguageManager.h"

#include "Poco/Net/SecureSMTPClientSession.h"
#include "Poco/Net/SSLException.h"


EmailManager::EmailManager()
	: Thread("emails", false), mInitalized(false), mDisableEmail(false)
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

	Poco::Net::SecureSMTPClientSession mailClientSession(mEmailAccount.url, mEmailAccount.port);
	mailClientSession.login();
	try {
		mailClientSession.startTLS(ServerConfig::g_SSL_CLient_Context);
		mailClientSession.login(Poco::Net::SMTPClientSession::AUTH_LOGIN, mEmailAccount.username, mEmailAccount.password);
	}
	catch (Poco::Net::SSLException& ex) {
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
			if (email->getUser()) {
				Poco::AutoPtr<model::table::User> userModel = email->getUser()->getModel();

				if (!userModel.isNull()) {
					userModel->lock("EmailManager::ThreadFunction");
					lang_code = LanguageManager::languageFromString(userModel->getLanguageKey());
					userModel->unlock();
					if (lang_code > LANG_COUNT) lang_code = ServerConfig::g_default_locale;
				}
			}
			if (catalogs[lang_code].isNull()) {
				catalogs[lang_code] = lm->getFreeCatalog(lang_code);
			}
			if (email->draft(&mailMessage, catalogs[lang_code])) {
				
				mailClientSession.sendMessage(mailMessage);
				// add for debugging
				if (email->getUser()) {
					auto user_model = email->getUser()->getModel();
					printf("send email to %s\n", user_model->getEmail().data());
				}
			}
			else {
				// error drafting email, shouldn't happend
				printf("[EmailManager::ThreadFunction] Error drafting email\n");
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