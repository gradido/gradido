#include "Gradido_LoginServer.h"
#include <sodium.h>

#include "proto/gradido/TransactionBody.pb.h"

#include "model/User.h"
#include "model/Session.h"
#include "lib/Profiler.h"
#include "ServerConfig.h"

#include "model/table/User.h"
#include "model/table/EmailOptIn.h"

#ifndef _TEST_BUILD


int main(int argc, char** argv)
{
	GOOGLE_PROTOBUF_VERIFY_VERSION;
	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
		printf("error initing sodium, early exit\n");
		return -1;
	}
	ServerConfig::g_versionString = "0.11.0";
	printf("User size: %d Bytes, Session size: %d Bytes\n", sizeof(User), sizeof(Session));
	printf("model sizes: User: %d Bytes, EmailOptIn: %d Bytes\n", sizeof(model::table::User), sizeof(model::table::EmailOptIn));

	
	Gradido_LoginServer app;
	return app.run(argc, argv);
}
#endif