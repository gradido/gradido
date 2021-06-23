#include "ElopageWebhook.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/URI.h"
#include "Poco/Logger.h"
#include "Poco/Data/Binding.h"
//#include "Poco/Data/MySQL/MySQLException.h"

using namespace Poco::Data::Keywords;

#include "../SingletonManager/ConnectionManager.h"
#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/SessionManager.h"
#include "../SingletonManager/EmailManager.h"

#include "../ServerConfig.h"


#include "../controller/EmailVerificationCode.h"
#include "../model/table/ElopageBuy.h"

#include "../lib/DataTypeConverter.h"


void ElopageWebhook::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	// simply write request to file for later lookup
	//ServerConfig::writeToFile(request.stream(), "elopage_webhook_requests.txt");

	// empty response, we didn't need to set anything
	//response.setStatus(Poco::Net::HTTPResponse::HTTP_NO_CONTENT);
	std::ostream& _responseStream = response.send();
	_responseStream << "200 OK";

	// don't use it anymore, register now direct 
	// elopage request are only logged from gpt server
	//return;

	std::istream& stream = request.stream();
	std::string completeRequest;
	Poco::Net::NameValueCollection elopageRequestData;
	int breakCount = 100;
	while (stream.good() && breakCount > 0) {
//		char dummy;
		//char keyBuffer[30]; memset(keyBuffer, 0, 30);
		//char valueBuffer[75]; memset(valueBuffer, 0, 75);
		std::vector<char> keyBuffer(30);
		std::vector<char> valueBuffer(75);
		/*stream.get(keyBuffer, 30, '=').get(dummy)
			  .get(valueBuffer, 35, '&').get(dummy);*/
		std::string line;
		std::getline(stream, line);
		int mode = 0;
		for (int i = 0; i < line.size(); i++) {
			char c = line.at(i);
			completeRequest += c;
			if (c == '\n') break;
			if (c == '+') {
				c = ' ';
			}
			if (c == '&') {
				mode = 0;
				valueBuffer.push_back('\0');
				keyBuffer.push_back('\0');
				std::string urlDecodedValue;
				try {
					Poco::URI::decode(valueBuffer.data(), urlDecodedValue);
				}
				catch (Poco::Exception& ex) {
					Poco::Logger& logging(Poco::Logger::get("errorLog"));
					logging.error("[ElopageWebhook::handleRequest] error decoding URI: %s, exception: %s", std::string(valueBuffer.data()), ex.displayText());
					urlDecodedValue = valueBuffer.data();
				}
				elopageRequestData.set(keyBuffer.data(), urlDecodedValue);
				valueBuffer.clear();
				keyBuffer.clear();
				continue;
			}
			switch (mode) {
			case 0: // read key
				if (c == '=') {
					mode = 1;
					continue;
				}
				keyBuffer.push_back(c);
				break;
			case 1: // read value
				valueBuffer.push_back(c);
				break;
			}
		}
		valueBuffer.push_back('\0');
		keyBuffer.push_back('\0');

		// last key-value pair
		std::string urlDecodedValue;
		try {
			Poco::URI::decode(valueBuffer.data(), urlDecodedValue);
		}
		catch (Poco::Exception& ex) {
			Poco::Logger& logging(Poco::Logger::get("errorLog"));
			logging.error("[ElopageWebhook::handleRequest] error decoding URI (last): %s, exception: %s", std::string(valueBuffer.data()), ex.displayText());
			urlDecodedValue = valueBuffer.data();
		}
		
		if (strcmp(keyBuffer.data(), "")) {
			elopageRequestData.set(keyBuffer.data(), urlDecodedValue);
		}

		//printf("[ElopageWebhook::handleRequest] key: %s, value: %s\n", keyBuffer, valueBuffer);
	///	elopageRequestData.set(keyBuffer, valueBuffer);
		stream.good();
		breakCount--;
	}

	// check event type
	std::string event = elopageRequestData.get("event", "");
	if (event == "lesson.viewed") {
		printf("elopage request was lesson viewed\n");
		return;
	}
	

	// write stream result also to file
	static Poco::Mutex mutex;
	Profiler timeUsed;
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
	std::string timeUsedStr = timeUsed.string();
	printf("[%s] time for elopage request write to file: %s\n", dateTimeStr.data(), timeUsedStr.data());
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


int HandleElopageRequestTask::getUserIdFromDB(bool checkEmail /* = false*/)
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement select(session);
	std::vector<int> user_ids;
	std::vector<bool> email_checked;
	if (checkEmail) {
		select << "SELECT id, email_checked from users where email = ?;",
			into(user_ids), into(email_checked), use(mEmail);
	}
	else {
		select << "SELECT id from users where email = ?;",
			into(user_ids), use(mEmail);
	}
	try {
		select.execute();
	}
	catch (Poco::Data::ConnectionFailedException& ex) {
		addError(new ParamError(__FUNCTION__, "[ConnectionFailedException] mysql error selecting from db", ex.displayText().data()));
		addError(new ParamError(__FUNCTION__, "email: ", mEmail.data()));
	}
	catch (Poco::Data::NotConnectedException& ex) {
		addError(new ParamError(__FUNCTION__, "[NotConnectedException] mysql error selecting from db", ex.displayText().data()));
		addError(new ParamError(__FUNCTION__, "email: ", mEmail.data()));
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
		if (email_checked.size() >= 1 && email_checked[0]) {
			addError(new Error("HandleElopageRequestTask::getUserIdFromDB", "user account already activated"));
			return 0;
		}
		return user_ids[0];
	}
	return 0;

	
}


int HandleElopageRequestTask::run()
{
	// get input data
	// check event type
	std::string event = mRequestData.get("event", "");
	if (event == "lesson.viewed" || event == "lesson.completed" || event == "lesson.commented") {
		return 0;
	}

	// elopage buy
	Poco::AutoPtr<model::table::ElopageBuy> elopageBuy(new model::table::ElopageBuy(mRequestData));
	if (elopageBuy->errorCount() > 0) {
		getErrors(elopageBuy);
	}
	UniLib::controller::TaskPtr saveElopageBuy(new model::table::ModelInsertTask(elopageBuy, false));
	saveElopageBuy->scheduleTask(saveElopageBuy);

	// check product id
	unsigned long long product_id = 0;
	DataTypeConverter::strToInt(mRequestData.get("product[id]", "0"), product_id);
	
	std::string order_id = mRequestData.get("order_id", "");
	auto param_error_order_id = new ParamError("HandleElopageRequestTask", "order_id", order_id.data());

	/*!
	 *

	Registrierung � Schritt 1 von 3, 36001
	Gradido-Basis, 43741
	Premium-Mitgliedschaft, 43870
	Gold-Mitgliedschaft, 43944
	Business-Mitgliedschaft, 43960
	F�rderbeitrag: 49106
 
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

		int group_id = 0;
		if (ServerConfig::g_devDefaultGroup != "") {
			auto groups = controller::Group::load(ServerConfig::g_devDefaultGroup);
			if (groups.size() == 1) {
				group_id = groups[0]->getModel()->getID();
			}
		}
		auto newUser = controller::User::create(mEmail, mFirstName, mLastName, group_id);

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
		//writeUserIntoDB();
		newUser->getModel()->insertIntoDB(true);

		// get user id from db
		//int user_id = getUserIdFromDB(true);
		int user_id = newUser->getModel()->getID();
		// we didn't get a user_id, something went wrong
		// maybe user already exist
		if (!user_id) {
			addError(new Error("User loadEntryDBId", "user_id is zero"));
			addError(param_error_order_id);
			sendErrorsAsEmail();
			return -3;
		}

		// email verification code
		auto emailVerification = controller::EmailVerificationCode::create(user_id, model::table::EMAIL_OPT_IN_REGISTER_DIRECT);
		//Poco::AutoPtr<model::table::EmailOptIn> emailVerification(new model::table::EmailOptIn(user_id));

		// create email verification code
		if (!emailVerification->getModel()->getCode()) {
			// exit if email verification code is empty
			addError(new Error("Email verification", "code is empty, error in random?"));
			addError(param_error_order_id);
			sendErrorsAsEmail();
			return -4;
		}
		auto em = EmailManager::getInstance();
		if (emailVerification->getModel()->insertIntoDB(false)) {
			int noEMail = 0;
			DataTypeConverter::strToInt(mRequestData.get("noEmail", "0"), noEMail);

			if (noEMail != 1) {
				emailVerification->setBaseUrl(ServerConfig::g_serverPath + "/checkEmail");
				em->addEmail(new model::Email(emailVerification, newUser, model::EMAIL_USER_VERIFICATION_CODE));
			}
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