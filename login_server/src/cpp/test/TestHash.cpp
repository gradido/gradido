#include "TestHash.h"
#include "../lib/DRHash.h"

#include <string>

TestHash::TestHash()
{

}

TestHash::~TestHash()
{

}

int TestHash::init()
{
	return 0;
}

int TestHash::test()
{
	std::string testEmails[] = {
		"a","b", "c", "d", "aa", "ab",
		"@", ".d", "gmx", "@gmx", "@gmx.de",
		"***REMOVED***",
		"***REMOVED***",
		"coin-info5@gradido.net",
		"coin-info6@gradido.net",
		"coin-info8@gradido.net",
		"coin-info9@gradido.net",
		"coin-info10@gradido.net",
		"coin-info11@gradido.net",
		"coin-info12@gradido.net"
	};
	printf("hashes: \n");
	for (int i = 0; i < 20; i++) {
		DHASH id = DRMakeStringHash(testEmails[i].data(), testEmails[i].size());
		//printf("%s: %lu\n", testEmails[i].data(), id);
		//"***REMOVED***" => 1211212
		printf("\"%s\" => %lu,\n", testEmails[i].data(), id);
	}
	return 0;
}

