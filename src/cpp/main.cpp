#include "Gradido_LoginServer.h"
#include <sodium.h>

int main(int argc, char** argv)
{
	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
		printf("error initing sodium, early exit\n");
		return -1;
	}

	Gradido_LoginServer app;
	return app.run(argc, argv);
}
