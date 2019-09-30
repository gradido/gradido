#include "Session.h"
#include "../ServerConfig.h"

#include "Poco/RegularExpression.h"
#include "Poco/Net/StringPartSource.h"

#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../tasks/PrepareEmailTask.h"
#include "../tasks/SendEmailTask.h"


#include "sodium.h"

using namespace Poco::Data::Keywords;

int WriteEmailVerification::run()
{	
	auto verificationCode = mSession->getEmailVerificationCode();

	auto dbSession = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	int user_id = mUser->getDBId();
	Poco::Data::Statement insert(dbSession);
	insert << "INSERT INTO email_opt_in (user_id, verification_code) VALUES(?,?);",
		use(user_id), use(verificationCode);
	if (1 != insert.execute()) {
		mSession->addError(new Error("WriteEmailVerification", "error inserting email verification code"));
		return -1;
	}

	return 0;
}

// ---------------------------------------------------------------------------------------------------------------



// --------------------------------------------------------------------------------------------------------------

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

	// check if user with that email already exist
	auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement select(dbConnection);
	select << "SELECT email from users where email = ?;", useRef(email);
	try {
		if (select.execute() > 0) {
			addError(new Error("E-Mail", "F&uuml;r diese E-Mail Adresse gibt es bereits einen Account"));
			return false;
		}
	}
	catch (Poco::Exception& exc) {
		printf("mysql exception: %s\n", exc.displayText().data());
	}

	mSessionUser = new User(email.data(), name.data());
	updateTimeout();

	// Prepare E-Mail
	UniLib::controller::TaskPtr prepareEmail(new PrepareEmailTask(ServerConfig::g_CPUScheduler));
	prepareEmail->scheduleTask(prepareEmail);

	// create user crypto key
	UniLib::controller::TaskPtr cryptoKeyTask(new UserCreateCryptoKey(mSessionUser, password, ServerConfig::g_CPUScheduler));
	cryptoKeyTask->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_CRYPTO_KEY_GENERATED, this));
	cryptoKeyTask->scheduleTask(cryptoKeyTask);

	// depends on crypto key, write user record into db
	UniLib::controller::TaskPtr writeUserIntoDB(new UserWriteIntoDB(mSessionUser, ServerConfig::g_CPUScheduler, 1));
	writeUserIntoDB->setParentTaskPtrInArray(cryptoKeyTask, 0);
	writeUserIntoDB->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_USER_WRITTEN, this));
	writeUserIntoDB->scheduleTask(writeUserIntoDB);

	createEmailVerificationCode();

	UniLib::controller::TaskPtr writeEmailVerification(new WriteEmailVerification(mSessionUser, this, ServerConfig::g_CPUScheduler, 1));
	writeEmailVerification->setParentTaskPtrInArray(writeUserIntoDB, 0);
	writeEmailVerification->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_WRITTEN, this));
	writeEmailVerification->scheduleTask(writeEmailVerification);

	// depends on writeUser because need user_id, write email verification into db
	auto message = new Poco::Net::MailMessage;

	message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, email));
	message->setSubject("Gradido: E-Mail Verification");
	std::stringstream ss;
	ss << "Hallo " << name << "," << std::endl << std::endl;
	ss << "Du oder jemand anderes hat sich soeben mit dieser E-Mail Adresse bei Gradido registriert. " << std::endl;
	ss << "Wenn du es warst, klicke bitte auf den Link: https://gradido2.dario-rekowski.de/accounts/checkEmail/" << mEmailVerificationCode << std::endl;
	ss << "oder kopiere den Code: " << mEmailVerificationCode << " selbst dort hinein." << std::endl << std::endl;
	ss << "Mit freundlichen Grüße" << std::endl;
	ss << "Dario, Gradido Server Admin" << std::endl;
	

	message->addContent(new Poco::Net::StringPartSource(ss.str()));

	UniLib::controller::TaskPtr sendEmail(new SendEmailTask(message, ServerConfig::g_CPUScheduler, 1));
	sendEmail->setParentTaskPtrInArray(prepareEmail, 0);
	sendEmail->setParentTaskPtrInArray(writeEmailVerification, 1);
	sendEmail->setFinishCommand(new SessionStateUpdateCommand(SESSION_STATE_EMAIL_VERIFICATION_SEND, this));
	sendEmail->scheduleTask(sendEmail);


	// write user into db
	// generate and write email verification into db
	// send email
	


	return true;
}

bool Session::updateEmailVerification(unsigned long long emailVerificationCode)
{
	const char* funcName = "Session::updateEmailVerification";
	auto em = ErrorManager::getInstance();
	if(mEmailVerificationCode == emailVerificationCode) {
		if (mSessionUser && mSessionUser->getDBId() == 0) {
			//addError(new Error("E-Mail Verification", "Benutzer wurde nicht richtig gespeichert, bitte wende dich an den Server-Admin"));
			em->addError(new Error(funcName, "user exist with 0 as id"));
			em->sendErrorsAsEmail();
			//return false;
		}
		
		// load correct user from db
		auto dbConnection = ConnectionManager::getInstance()->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
		Poco::Data::Statement update(dbConnection);
		update << "UPDATE users SET email_checked=1 where id = (SELECT user_id FROM email_opt_in where verification_code=?)", use(emailVerificationCode);
		auto updated_rows = update.execute();
		if (updated_rows == 1) {
			Poco::Data::Statement delete_row(dbConnection);
			delete_row << "DELETE FROM email_opt_in where verification_code = ?", use(emailVerificationCode);
			if (delete_row.execute() != 1) {
				em->addError(new Error(funcName, "delete from email_opt_in entry didn't work as expected, please check db"));
				em->sendErrorsAsEmail();
			}
			updateState(SESSION_STATE_EMAIL_VERIFICATION_CODE_CHECKED);
			return true;
		}
		else {
			em->addError(new ParamError(funcName, "update user work not like expected, updated row count", updated_rows));
			em->sendErrorsAsEmail();
		}
		if (!updated_rows) {
			addError(new Error("E-Mail Verification", "Der Code stimmt nicht, bitte überprüfe ihn nochmal oder registriere dich erneut oder wende dich an den Server-Admin"));
			return false;
		}
		
	}
	else {
		addError(new Error("E-Mail Verification", "Falscher Code für aktiven Login"));
		return false;
	}
	return false;
}



bool Session::loadUser(const std::string& email, const std::string& password)
{
	return true;
}

void Session::updateState(SessionStates newState)
{
	lock();
	printf("[Session::%s] newState: %s\n", __FUNCTION__, translateSessionStateToString(newState));
	if (newState > mState) {
		mState = newState;
	}

	unlock();
}

const char* Session::getSessionStateString()
{
	SessionStates state;
	lock();
	state = mState;
	unlock();
	return translateSessionStateToString(state);
}


const char* Session::translateSessionStateToString(SessionStates state)
{
	switch (state) {
	case SESSION_STATE_CRYPTO_KEY_GENERATED: return "crpyto key generated";
	case SESSION_STATE_USER_WRITTEN: return "User saved";
	case SESSION_STATE_EMAIL_VERIFICATION_WRITTEN: return "E-Mail verification code saved";
	case SESSION_STATE_EMAIL_VERIFICATION_SEND: return "Verification E-Mail sended";
	case SESSION_STATE_KEY_PAIR_GENERATED: return "Gradido Address created";
	case SESSION_STATE_KEY_PAIR_WRITTEN: return "Gradido Address saved";
	default: return "unknown";
	}

	return "error";
}

void Session::createEmailVerificationCode()
{
	uint32_t* code_p = (uint32_t*)&mEmailVerificationCode;
	for (int i = 0; i < EMAIL_VERIFICATION_CODE_SIZE / 4; i++) {
		code_p[i] = randombytes_random();
	}

}