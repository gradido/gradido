#include <stdio.h>
#include <sodium.h>


int main(int argc, char* argv[]) {
	printf("hallo Welt\n");

	if (sodium_init() < 0) {
		/* panic! the library couldn't be initialized, it is not safe to use */
	}
	else {
		printf("sodium initalized\n");
	}

	return 42;
}