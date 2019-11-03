#include "Gradido_LoginServer.h"
#include <sodium.h>

#include "proto/gradido/TransactionBody.pb.h"

#include "model/User.h"
#include "model/Session.h"

int main(int argc, char** argv)
{
	GOOGLE_PROTOBUF_VERIFY_VERSION;
	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
		printf("error initing sodium, early exit\n");
		return -1;
	}
	printf("User size: %d Bytes, Session size: %d Bytes\n", sizeof(User), sizeof(Session));

	Gradido_LoginServer app;
	return app.run(argc, argv);
}
