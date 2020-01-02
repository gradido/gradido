#include "EmailManager.h"
#include "../ServerConfig.h"

#include "../Crypto/Obfus_array.h"
#include "../Crypto/DRRandom.h"

EmailManager::EmailManager()
	: mInitalized(false), mDisableEmail(false)
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
		mEmailAccount.sender = cfg.getString("email.sender");
		mEmailAccount.admin_receiver = cfg.getString("email.admin_receiver");
		mEmailAccount.username = cfg.getString("email.username");
		mEmailAccount.password = cfg.getString("email.password");
		mEmailAccount.url = cfg.getString("email.smtp.url");
		mEmailAccount.port = cfg.getInt("email.smtp.port");
	}
	catch (Poco::Exception& ex) {
		printf("email account not set in config: %s\n", ex.displayText().data());
		return false;
	}
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
	return 0;
}