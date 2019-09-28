#include "Session.h"
#include "../ServerConfig.h"
#include "Poco/RegularExpression.h"
#include "../SingletonManager/SessionManager.h"

#include "sodium.h"

Session::Session(int handle)
	: mHandleId(handle), mSessionUser(nullptr)
{

}

Session::~Session()
{


}


void Session::reset()
{
	if (mSessionUser) {
		delete mSessionUser;
		mSessionUser = nullptr;
	}
	updateTimeout();
	mClientLoginIP = Poco::Net::IPAddress();
}

void Session::updateTimeout()
{
	mLastActivity = Poco::DateTime();
}

bool Session::createUser(const std::string& name, const std::string& email, const std::string& password)
{
	auto sm = SessionManager::getInstance();
	if (!sm->isValid(name, VALIDATE_NAME)) {
		addError(new Error("Vorname", "Bitte gebe einen Namen an. Mindestens 3 Zeichen, keine Sonderzeichen oder Zahlen."));
		return false;
	}
	if (!sm->isValid(email, VALIDATE_EMAIL)) {
		addError(new Error("E-Mail", "Bitte gebe eine g&uuml;ltige E-Mail Adresse an."));
		return false;
	}
	if (!sm->isValid(password, VALIDATE_PASSWORD)) {
		addError(new Error("Password", "Bitte gebe ein g&uuml;ltiges Password ein mit mindestens 8 Zeichen, Gro&szlig;- und Kleinbuchstaben, mindestens einer Zahl und einem Sonderzeichen"));
		return false;
	}
	/*if (passphrase.size() > 0 && !sm->isValid(passphrase, VALIDATE_PASSPHRASE)) {
		addError(new Error("Merkspruch", "Der Merkspruch ist nicht g&uuml;ltig, er besteht aus 24 W&ouml;rtern, mit Komma getrennt."));
		return false;
	}
	if (passphrase.size() == 0) {
		//mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);
		mPassphrase = User::generateNewPassphrase(&ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER]);
	}
	else {
		//mPassphrase = passphrase;
	}*/

	mSessionUser = new User(email.data(), name.data());
	updateTimeout();

	// create user crypto key
	UniLib::controller::TaskPtr cryptoKeyTask(new UserCreateCryptoKey(mSessionUser, password, ServerConfig::g_CPUScheduler));
	//cryptoKeyTask->scheduleTask(cryptoKeyTask);

	// depends on crypto key
	UniLib::controller::TaskPtr writeUserIntoDB(new UserWriteIntoDB(mSessionUser, ServerConfig::g_CPUScheduler, 1));
	writeUserIntoDB->setParentTaskPtrInArray(cryptoKeyTask, 0);
	writeUserIntoDB->scheduleTask(writeUserIntoDB);

	// write user into db
	// generate and write email verification into db
	// send email
	createEmailVerificationCode();


	return true;
}



bool Session::loadUser(const std::string& email, const std::string& password)
{
	return true;
}


int Session::createEmailVerificationCode()
{
	uint32_t* code_p = (uint32_t*)mEmailVerification;
	for (int i = 0; i < EMAIL_VERIFICATION_CODE_SIZE / 4; i++) {
		code_p[i] = randombytes_random();
	}

	return 0;
}