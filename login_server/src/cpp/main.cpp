#include "Gradido_LoginServer.h"
#include <sodium.h>

#include "proto/gradido/TransactionBody.pb.h"


#include "model/Session.h"
#include "lib/Profiler.h"
#include "ServerConfig.h"
#include "ImportantTests.h"

#include "model/table/User.h"
#include "model/table/EmailOptIn.h"

#include "Poco/DateTimeParser.h"

#ifndef _TEST_BUILD


int main(int argc, char** argv)
{
	GOOGLE_PROTOBUF_VERIFY_VERSION;
	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
		printf("error initializing sodium, early exit\n");
		return -1;
	}

	std::string dateTimeString = __DATE__;
	//printf("Building date time string: %s\n", dateTimeString.data());
	std::string formatString("%b %d %Y");
	int timeZone = 0;

	Poco::DateTime buildDateTime = Poco::DateTimeParser::parse(formatString, dateTimeString, timeZone);
	ServerConfig::g_versionString = Poco::DateTimeFormatter::format(buildDateTime, "0.%y.%m.%d");
	//ServerConfig::g_versionString = "0.20.KW13.02";
	printf("Version: %s\n", ServerConfig::g_versionString.data());
	printf("User size: %d Bytes, Session size: %d Bytes\n", (int)sizeof(controller::User), (int)sizeof(Session));
	printf("model sizes: User: %d Bytes, EmailOptIn: %d Bytes\n", (int)sizeof(model::table::User), (int)sizeof(model::table::EmailOptIn));

	// load word lists
	if (!ServerConfig::loadMnemonicWordLists()) {
		//printf("[Gradido_LoginServer::%s] error loading mnemonic Word List\n", __FUNCTION__);
		printf("[Gradido_LoginServer::main] error loading mnemonic Word List");
		return -2;
	}
	printf("[Gradido_LoginServer::main] mnemonic word lists loaded!\n");

	if (!ImportantTests::passphraseGenerationAndTransformation()) {
		printf("test passphrase generation and transformation failed\n");
		return -3;
	}
	printf("[Gradido_LoginServer::main] passed important tests\n");

	Gradido_LoginServer app;
	try {
		auto result = app.run(argc, argv);
		return result;
	}
	catch (Poco::Exception& ex) {
		printf("[Gradido_LoginServer::main] exception by starting server: %s\n", ex.displayText().data());
	}
	return -1;

}
#endif
