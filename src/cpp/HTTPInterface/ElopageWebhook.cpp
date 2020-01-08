#include "ElopageWebhook.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/URI.h"
#include "Poco/Logger.h"
#include "Poco/Data/Binding.h"

using namespace Poco::Data::Keywords;

#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SessionManager.h"

#include "../ServerConfig.h"

#include "../tasks/PrepareEmailTask.h"
#include "../tasks/SendEmailTask.h"

#include "../controller/EmailVerificationCode.h"
#include "../model/table/ElopageBuy.h"




void ElopageWebhook::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	//ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");

	// empty response, we didn't need to set anything

	std::istream& stream = request.stream();
	std::string completeRequest;
	Poco::Net::NameValueCollection elopageRequestData;
	int breakCount = 100;
	while (stream.good() && breakCount > 0) {
//		char dummy;
		char keyBuffer[30]; memset(keyBuffer, 0, 30);
		char valueBuffer[75]; memset(valueBuffer, 0, 75);
		/*stream.get(keyBuffer, 30, '=').get(dummy)
			  .get(valueBuffer, 35, '&').get(dummy);*/
		std::string line;
		std::getline(stream, line);
		int mode = 0;
		int cursor = 0;
		for (int i = 0; i < line.size(); i++) {
			char c = line.at(i);
			completeRequest += c;
			if (c == '\n') break;
			if (c == '+') {
				c = ' ';
			}
			if (c == '&') {
				mode = 0;
				cursor = 0;
				std::string urlDecodedValue;
				Poco::URI::decode(valueBuffer, urlDecodedValue);
				elopageRequestData.set(keyBuffer, urlDecodedValue);
				memset(keyBuffer, 0, 30);
				memset(valueBuffer, 0, 75);
				continue;
			}
			switch (mode) {
			case 0: // read key
				if (c == '=') {
					mode = 1;
					cursor = 0;
					continue;
				}
				if (cursor < 29) {
					keyBuffer[cursor++] = c;
				}
				else {
					int zahl = 1;
				}
				break;
			case 1: // read value
				if (cursor < 74) {
					valueBuffer[cursor++] = c;
				}
				else {
					int zahl = 1;
				}
				break;
			}
		}
		// last key-value pair
		std::string urlDecodedValue;
		Poco::URI::decode(valueBuffer, urlDecodedValue);
		if (strcmp(keyBuffer, "")) {
			elopageRequestData.set(keyBuffer, urlDecodedValue);
		}

		//printf("[ElopageWebhook::handleRequest] key: %s, value: %s\n", keyBuffer, valueBuffer);
	///	elopageRequestData.set(keyBuffer, valueBuffer);
		stream.good();
		breakCount--;
	}

	// check event type
	std::string event = elopageRequestData.get("event", "");
	if (event == "lesson.viewed") {
		return;
	}
	

	// write stream result also to file
	static Poco::Mutex mutex;

	mutex.lock();

	Poco::FileOutputStream file("elopage_webhook_requests.txt", std::ios::out | std::ios::app);

	if (!file.good()) {
		Poco::Logger& logging(Poco::Logger::get("errorLog"));
		logging.error("[ElopageWebhook::handleRequest] error creating file with name: elopage_webhook_requests.txt");
		//printf("[ElopageWebhook::handleRequest] error creating file with name: elopage_webhook_requests.txt\n");
		mutex.unlock();
		return;
	}

	Poco::LocalDateTime now;

	std::string dateTimeStr = Poco::DateTimeFormatter::format(now, Poco::DateTimeFormat::ISO8601_FORMAT);
	file << dateTimeStr << std::endl;
	file << completeRequest << std::endl;
	file << std::endl;
	file.close();
	mutex.unlock();


	UniLib::controller::TaskPtr handleElopageTask(new HandleElopageRequestTask(elopageRequestData));
	handleElopageTask->scheduleTask(handleElopageTask);

}


// ****************************************************************************
HandleElopageRequestTask::HandleElopageRequestTask(Poco::Net::NameValueCollection& requestData)
	: CPUTask(ServerConfig::g_CPUScheduler), mRequestData(requestData) 
{
#ifdef _UNI_LIB_DEBUG
	setName(mRequestData.get("order_id", "").data());
#endif
}

bool HandleElopageRequestTask::validateInput()
{
	auto sm = SessionManager::getInstance();
	if (mEmail == "" || !sm->isValid(mEmail, VALIDATE_EMAIL)) {
		addError(new Error(__FUNCTION__, "email is invalid or empty"));
		return false;
	}
	if (mFirstName == "" || !sm->isValid(mFirstName, VALIDATE_NAME)) {
		addError(new Error(__FUNCTION__, "first name is invalid or empty"));
		return false;
	}

	if (mLastName == "" || !sm->isValid(mLastName, VALIDATE_NAME)) {
		addError(new Error(__FUNCTION__, "last name is invalid or empty"));
		return false;
	}

	return true;
}


void HandleElopageRequestTask::writeUserIntoDB()
{
	printf("HandleElopageRequestTask::writeUserIntoDB\n");
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement insert(session);
	insert << "INSERT INTO users (email, first_name, last_name) VALUES(?, ?, ?);",
		use(mEmail), use(mFirstName), use(mLastName);
	try {
		insert.execute();
		//printf("user written into db\n");
	}
	catch (Poco::Exception& ex) {
		addError(new ParamError(__FUNCTION__, "mysql error", ex.displayText().data()));
	}
}


int HandleElopageRequestTask::getUserIdFromDB()
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement select(session);
	std::vector<int> user_ids;
	select << "SELECT id from users where email = ?;",
		into(user_ids), use(mEmail);
	try {
		select.execute();
	}
	catch (Poco::Exception& ex) {
		addError(new ParamError(__FUNCTION__, "mysql error selecting from db", ex.displayText().data()));
		addError(new ParamError(__FUNCTION__, "email: ", mEmail.data()));
	}
	if (user_ids.size() > 1) {
		std::string duplicateIds("duplicate user ids for email: ");
		duplicateIds += mEmail;
		duplicateIds += ": ";
		for (int i = 0; i < user_ids.size(); i++) {
			if (i > 0) {
				duplicateIds += ", ";
			}
			duplicateIds += std::to_string(user_ids[i]);
		}
		addError(new Error("HandleElopageRequestTask::getUserIdFromDB", duplicateIds.data()));
		sendErrorsAsEmail();
	}
	if (user_ids.size() >= 1) {
		return user_ids[0];
	}
	return 0;

	
}


int HandleElopageRequestTask::run()
{
	// get input data
	// check event type
	std::string event = mRequestData.get("event", "");
	if (event == "lesson.viewed" || event == "lesson.completed") {
		return 0;
	}

	// elopage buy
	Poco::AutoPtr<model::table::ElopageBuy> elopageBuy(new model::table::ElopageBuy(mRequestData));
	if (elopageBuy->errorCount() > 0) {
		getErrors(elopageBuy);
	}
	UniLib::controller::TaskPtr saveElopageBuy(new model::table::ModelInsertTask(elopageBuy));
	saveElopageBuy->scheduleTask(saveElopageBuy);

	// check product id
	Poco::UInt64 product_id = 0;
	try {
		product_id = stoull(mRequestData.get("product[id]", "0"));
	}
	catch (const std::invalid_argument& ia) {
		std::cerr << __FUNCTION__ << "Invalid argument: " << ia.what() << '\n';
	}
	catch (const std::out_of_range& oor) {
		std::cerr << __FUNCTION__ << "Out of Range error: " << oor.what() << '\n';
	}
	catch (const std::logic_error & ler) {
		std::cerr << __FUNCTION__ << "Logical error: " << ler.what() << '\n';
	}
	catch (...) {
		std::cerr << __FUNCTION__ << "Unknown error" << '\n';
	}
	std::string order_id = mRequestData.get("order_id", "");
	auto param_error_order_id = new ParamError("HandleElopageRequestTask", "order_id", order_id.data());

	/*!
	 *

	Registrierung – Schritt 1 von 3, 36001
	Gradido-Basis, 43741
	Premium-Mitgliedschaft, 43870
	Gold-Mitgliedschaft, 43944
	Business-Mitgliedschaft, 43960
	Förderbeitrag: 49106
 
	 *
	*/
	static const int valid_product_ids[] = { 36001, 43741, 43870, 43944, 43960, 49106 };
	bool valid_product_id = false;
	for (int i = 0; i < sizeof(valid_product_ids) / sizeof(int); i++) {
		if (valid_product_ids[i] == product_id) {
			valid_product_id = true;
			break;
		}
	}
	// only for product 36001 and 43741 create user accounts and send emails
	if (valid_product_id) {
		mEmail = mRequestData.get("payer[email]", "");
		mFirstName = mRequestData.get("payer[first_name]", "");
		mLastName = mRequestData.get("payer[last_name]", "");
		auto newUser = controller::User::create(mEmail, mFirstName, mLastName);

		/* printf("LastName: %s\n", mLastName.data());
		for (int i = 0; i < mLastName.size(); i++) {
			char c = mLastName.data()[i];
			printf("%d ", c);
		}
		printf("\n\n");
		*/

		// validate input
		if (!validateInput()) {
			// if input is invalid we can stop now
			addError(param_error_order_id);
			sendErrorsAsEmail();
			return -1;
		}

		// if user exist we can stop now
		if (getUserIdFromDB()) {
			//addError(param_error_order_id);
			//sendErrorsAsEmail();
			return -2;
		}

		// if user with this email didn't exist
		// we can create a new user and send a email to him

		// prepare email in advance
		// create connection to email server
	//	UniLib::controller::TaskPtr prepareEmail(new PrepareEmailTask(ServerConfig::g_CPUScheduler));
//		prepareEmail->scheduleTask(prepareEmail);

		// write user entry into db
		writeUserIntoDB();

		// get user id from db
		int user_id = getUserIdFromDB();
		// we didn't get a user_id, something went wrong
		if (!user_id) {
			addError(new Error("User loadEntryDBId", "user_id is zero"));
			addError(param_error_order_id);
			sendErrorsAsEmail();
			return -3;
		}

		// email verification code
		auto emailVerification = controller::EmailVerificationCode::create(user_id);
		//Poco::AutoPtr<model::table::EmailOptIn> emailVerification(new model::table::EmailOptIn(user_id));

		// create email verification code
		if (!emailVerification->getModel()->getCode()) {
			// exit if email verification code is empty
			addError(new Error("Email verification", "code is empty, error in random?"));
			addError(param_error_order_id);
			sendErrorsAsEmail();
			return -4;
		}

		// write email verification code into db
		UniLib::controller::TaskPtr saveEmailVerificationCode(new model::table::ModelInsertTask(emailVerification->getModel()));
		saveEmailVerificationCode->scheduleTask(saveEmailVerificationCode);
		int noEMail = 0;

		std::string noEmailString = mRequestData.get("noEmail", "0");
		try {
			noEMail = stoi(noEmailString);
		}
		catch (const std::invalid_argument& ia) {
			std::cerr << __FUNCTION__ << " Invalid argument: " << ia.what() << ", str: " << noEmailString << '\n';
		}
		catch (const std::out_of_range& oor) {
			std::cerr << __FUNCTION__ << " Out of Range error: " << oor.what() << '\n';
		}
		catch (const std::logic_error & ler) {
			std::cerr << __FUNCTION__ << " Logical error: " << ler.what() << '\n';
		}
		catch (...) {
			std::cerr << __FUNCTION__ << " Unknown error" << '\n';
		}

		if (noEMail != 1) {

			// send email to user
			/*auto message = new Poco::Net::MailMessage;

			message->addRecipient(Poco::Net::MailRecipient(Poco::Net::MailRecipient::PRIMARY_RECIPIENT, mEmail));
			message->setSubject("Gradido: E-Mail Verification");
			std::stringstream ss;
			ss << "Hallo " << mFirstName << " " << mLastName << "," << std::endl << std::endl;
			ss << "Du oder jemand anderes hat sich soeben mit dieser E-Mail Adresse bei Gradido registriert. " << std::endl;
			ss << "Wenn du es warst, klicke bitte auf den Link: " << ServerConfig::g_serverPath << "/checkEmail/" << emailVerification->getModel()->getCode() << std::endl;
			//ss << "oder kopiere den Code: " << mEmailVerificationCode << " selbst dort hinein." << std::endl;
			ss << "oder kopiere den obigen Link in Dein Browserfenster." << std::endl;
			ss << std::endl;

			ss << "Mit freundlichen " << u8"Grüßen" << std::endl;
			ss << "Dario, Gradido Server Admin" << std::endl;

			message->addContent(new Poco::Net::StringPartSource(ss.str()));
			*/
			//UniLib::controller::TaskPtr sendEmail(new SendEmailTask(message, ServerConfig::g_CPUScheduler, 1));
			//Email(AutoPtr<controller::EmailVerificationCode> emailVerification, AutoPtr<controller::User> user, EmailType type);
			UniLib::controller::TaskPtr sendEmail(new SendEmailTask(new model::Email(emailVerification, newUser, model::EMAIL_USER_VERIFICATION_CODE), ServerConfig::g_CPUScheduler, 1));
			//sendEmail->setParentTaskPtrInArray(prepareEmail, 0);
			sendEmail->setParentTaskPtrInArray(saveEmailVerificationCode, 0);
			sendEmail->scheduleTask(sendEmail);
		}
	}

		// if errors occured, send via email
	if (errorCount() > 1) {
		addError(param_error_order_id);
		sendErrorsAsEmail();
	}
	else {
		delete param_error_order_id;
	}
	
	return 0;
}