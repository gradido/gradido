
#include "main.h"
#include <list>
#include "gtest/gtest.h"

#include "Poco/Util/PropertyFileConfiguration.h"



std::list<Test*> gTests;

void fillTests()
{
	gTests.push_back(new TestTasks());
	gTests.push_back(new TestHash());
	gTests.push_back(new TestRegExp());
	gTests.push_back(new TestPassphrase());
	//	gTests.push_back(new LoginTest());
}

int load() {
	// init server config, init seed array

	Poco::AutoPtr<Poco::Util::LayeredConfiguration> test_config(new Poco::Util::LayeredConfiguration);
	auto cfg = new Poco::Util::PropertyFileConfiguration("Gradido_LoginServer_Test.properties");
	test_config->add(cfg);

	if (!ServerConfig::initServerCrypto(*test_config)) {
		//printf("[Gradido_LoginServer::%s] error init server crypto\n", __FUNCTION__);
		printf("[load] error init server crypto");
		return -1;
	}
	if (!ServerConfig::loadMnemonicWordLists()) {
		printf("[load] error in loadMnemonicWordLists");
		return -2;
	}

	fillTests();
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		if ((*it)->init()) printf("Fehler bei Init test: %s\n", (*it)->getName());
	}
	return 0;
}

int run()
{
	//printf("running tests\n");
	printf("running tests\n");
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		//printf("running: %s\n", it->getName());
		printf("running test: %s\n", (*it)->getName());
		if (!(*it)->test()) printf("success\n");
	}
	return 0;
}

void ende()
{
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		if (*it) {
			delete *it;
		}
		
	}
	gTests.clear();
}


int main(int argc, char** argv) 
{
	load();
	run();
	ende();
	::testing::InitGoogleTest(&argc, argv);

	auto result = RUN_ALL_TESTS();
	ServerConfig::unload();
	return result;
}
