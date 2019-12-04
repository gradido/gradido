#include "Gradido_LoginServer.h"
#include <sodium.h>

#include "proto/gradido/TransactionBody.pb.h"

#include "model/User.h"
#include "model/Session.h"
#include "lib/Profiler.h"
#include "ServerConfig.h"

#ifndef _TEST_BUILD


int main(int argc, char** argv)
{
	GOOGLE_PROTOBUF_VERIFY_VERSION;
	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
		printf("error initing sodium, early exit\n");
		return -1;
	}
	ServerConfig::g_versionString = "0.9.0";
	printf("User size: %d Bytes, Session size: %d Bytes\n", sizeof(User), sizeof(Session));

	// first check time for crypto 
	auto testUser = new User("email@google.de", "Max", "Mustermann");
	Profiler timeUsed;
	testUser->validatePwd("haz27Newpassword", nullptr);
	ServerConfig::g_FakeLoginSleepTime = (int)std::round(timeUsed.millis());
	delete testUser;
	
	
	Gradido_LoginServer app;
	return app.run(argc, argv);
}
#endif