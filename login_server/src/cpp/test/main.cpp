
#include "main.h"
#include <list>
#include "gtest/gtest.h"

#include "Poco/Util/PropertyFileConfiguration.h"
#include "Poco/Environment.h"
#include "Poco/Path.h"
#include "Poco/AsyncChannel.h"
#include "Poco/SimpleFileChannel.h"
#include "Poco/FileChannel.h"
#include "Poco/ConsoleChannel.h"
#include "Poco/SplitterChannel.h"

#include "../SingletonManager/ConnectionManager.h"

#include "../lib/Profiler.h"


std::list<Test*> gTests;

void fillTests()
{
	gTests.push_back(new TestTasks());
	gTests.push_back(new TestRegExp());
	gTests.push_back(new TestPassphrase());
	//	gTests.push_back(new LoginTest());
}

void runMysql(std::string sqlQuery)
{
	auto cm = ConnectionManager::getInstance();
	auto session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement mysqlStatement(session);
	mysqlStatement << sqlQuery;

	try {
		mysqlStatement.execute(true);
	}
	catch (Poco::Exception& ex) {
		printf("exception in runMysql: %s\n", ex.displayText().data());
	}
}

int load(int argc, char* argv[]) {
	// init server config, init seed array
	std::clog << "[load]" << std::endl;
	Poco::AutoPtr<Poco::Util::LayeredConfiguration> test_config(new Poco::Util::LayeredConfiguration);
	std::string config_file_name = Poco::Path::config() + "grd_login/grd_login_test.properties";
	if(argc > 1 && strlen(argv[1]) > 4) {
		config_file_name = argv[1];
	}

	try {
		auto cfg = new Poco::Util::PropertyFileConfiguration(config_file_name);
		test_config->add(cfg);
	}
	catch (Poco::Exception& ex) {
		std::clog 
			<< "[load] error loading grd_login_test.properties, make sure this file exist! " 
			<< ex.displayText().data()
			<< std::endl;

		return -3;
	}

	if (!ServerConfig::initServerCrypto(*test_config)) {
		//printf("[Gradido_LoginServer::%s] error init server crypto\n", __FUNCTION__);
		printf("[load] error init server crypto");
		return -1;
	}
	if (!ServerConfig::loadMnemonicWordLists()) {
		printf("[load] error in loadMnemonicWordLists");
		return -2;
	}

	// start cpu scheduler
	uint8_t worker_count = Poco::Environment::processorCount();

	ServerConfig::g_CPUScheduler = new UniLib::controller::CPUSheduler(worker_count, "Default Worker");
	ServerConfig::g_CryptoCPUScheduler = new UniLib::controller::CPUSheduler(2, "Crypto Worker");

	// load up connection configs
	// register MySQL connector
	Poco::Data::MySQL::Connector::registerConnector();
	//Poco::Data::MySQL::Connector::KEY;
	auto conn = ConnectionManager::getInstance();
	//conn->setConnection()
	//printf("try connect login server mysql db\n");
	bool connected = false;
	try {
		if(conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_LOGIN_SERVER)) {
			connected = true;
		}
	}
	catch (Poco::Exception& ex) {
		// maybe we in docker environment and db needs some time to start up
		printf("Poco Exception by connecting to db: %s, let's try again\n", ex.displayText().data());
	}
	if(!connected) {
		// let's wait 10 seconds
		int count = 10;
		while (count > 0) {
			printf("\rwait on mysql/mariadb %d seconds...", count);
			count--;
			Poco::Thread::sleep(1000);
		}
		try {
			if(conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_LOGIN_SERVER)) {
				connected = true;
			}
		} catch(Poco::Exception& ex) {
			printf("Poco Exception by connecting to db: %s, let's wait another 10 seconds\n", ex.displayText().data());
		}
	}
	if(!connected) {
		Poco::Thread::sleep(10000);
		try {
			conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_LOGIN_SERVER);
		} catch(Poco::Exception& ex) {
			printf("Poco Exception by connecting to db: %s, exit\n", ex.displayText().data());
			return -4;
		}
	}
	
	std::string log_Path = "/var/log/grd_login/";
//#ifdef _WIN32
#if defined(_WIN32) || defined(_WIN64)
	log_Path = "./";
#endif
	
	std::string filePath = log_Path + "errorLog.txt";
	Poco::AutoPtr<Poco::ConsoleChannel> logConsoleChannel(new Poco::ConsoleChannel);
	Poco::AutoPtr<Poco::FileChannel> logFileChannel(new Poco::FileChannel(filePath));
	Poco::AutoPtr<Poco::SplitterChannel> logSplitter(new Poco::SplitterChannel);
	logSplitter->addChannel(logConsoleChannel);
	logSplitter->addChannel(logFileChannel);

	Poco::AutoPtr<Poco::AsyncChannel> logAsyncChannel(new Poco::AsyncChannel(logSplitter));

	Poco::Logger& log = Poco::Logger::get("errorLog");
	log.setChannel(logAsyncChannel);
	log.setLevel("information");

	log.error("Test Error");

	//errorLog
	
	//printf("try connect php server mysql \n");
	//conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_PHP_SERVER);

	Profiler timeUsed;

	// clean up and fill db
	std::string tables[] = { 
		"groups",
		"users"
	};
	for (int i = 0; i < 2; i++) {
		runMysql("TRUNCATE " + tables[i]);
		runMysql("ALTER TABLE " + tables[i] + " AUTO_INCREMENT = 1");
	}

	std::stringstream ss;
	ss << "INSERT INTO `users` (`id`, `email`, `first_name`, `last_name`, `username`, `password`, `pubkey`, `privkey`, `created`, `email_checked`, `passphrase_shown`, `language`, `disabled`, `group_id`) VALUES "
		<< "(1, 'd_schultz32@gmx.de', 'DDD', 'Schultz', 'Diddel', 13134558453895551556, 0x146d3fb9e88abc0fca0b0091c1ab1b32b399be037436f340befa8bf004461889, 0x0dcc08960f45f631fe23bc7ddee0724cedc9ec0c861ce30f5091d20ffd96062d08ca215726fb9bd64860c754772e945eea4cc872ed0a36c7b640e8b0bf7a873ec6765fa510711622341347ce2307b5ce, '2020-02-20 16:05:44', 1, 0, 'de', 0, 1), "
		<< "(2, 'Jeet_bb@gmail.com', 'Darios', 'Bruder', 'Jeet', 12910944485867375321, 0x952e215a21d4376b4ac252c4bf41e156e1498e1b6b8ccf2a6826d96712f4f461, 0x4d40bf0860655f728312140dc3741e897bc2d13d00ea80a63e2961046a5a7bd8315397dfb488b89377087bc1a5f4f3af8ffdcf203329ae23ba04be7d38ad3852699d90ff1fc00e5b1ca92b64cc59c01f, '2020-02-20 16:05:44', 1, 0, 'de', 0, 1), "
		<< "(3, 'Tiger_231@yahoo.com', 'Dieter', 'Schultz', 'Tiger', 13528673707291575501, 0xb539944bf6444a2bfc988244f0c0c9dc326452be9b8a2a43fcd90663719f4f6d, 0x5461fda60b719b65ba00bd6298e48410c4cbf0e89deb13cc784ba8978cf047454e8556ee3eddc8487ee835c33a83163bc8d8babbf2a5c431876bc0a0c114ff0a0d6b57baa12cf8f23c64fb642c862db5, '2020-02-20 16:05:45', 1, 0, 'de', 0, 1), "
		<< "(4, 'Nikola_Tesla@email.de', 'Nikola', 'Tesla', 'Erfinder', 15522411320147607375, 0x476b059744f08b0995522b484c90f8d2f47d9b59f4b3c96d9dc0ae6ab7b84979, 0x5277bf044cba4fec64e6f4d38da132755b029161231daefc9a7b4692ad37e05cdd88e0a2c2215baf854dd3a813578c214167af1113607e9f999ca848a7598ba5068e38f2a1afb097e4752a88024d79c8, '2020-02-20 16:05:46', 1, 0, 'de', 0, 1), "
		<< "(5, 'Elfenhausen@arcor.de', 'Thomas', 'Markuk', 'Elf', 7022671043835614958, 0xb1584e169d60a7e771d3a348235dfd7b5f9e8235fcc26090761a0264b0daa6ff, 0xb46fb7110bf91e28f367aa80f84d1bbd639b6f689f4b0aa28c0f71529232df9bf9ee0fb02fa4c1b9f5a6799c82d119e5646f7231d011517379faaacf6513d973ac3043d4c786490ba62d56d75b86164d, '2020-02-20 16:05:46', 1, 0, 'de', 0, 1), "
		<< "(6, 'coin-info12@gradido.net', 'coin-info12', 'Test', 'Test Username', 1548398919826089202, 0x4046ae49c1b620f2a321aba0c874fa2bc7ba844ab808bb0eeb18a908d468db14, 0x9522657ecd7456eedf86d065aa087ba7a94a8961a8e4950d044136155d38fe0840f2c0a2876ce055b3eaa6e9ab95c5feba89e535e0434fb2648d94d6e6ec68211aa2ea9e42d1ccd40b6b3c31e41f848e, '2020-02-20 16:05:47', 1, 0, 'de', 0, 1), "
		<< "(7, 'AlexWesper@gmail.com', 'Alex', 'Wesper', 'Wespe', 5822761891727948301, 0xb13ede3402abb8f29722b14fec0a2006ae7a3a51fb677cd6a2bbd797ac6905a5, 0x6aa39d7670c64a31639c7d89b874ad929b2eaeb2e5992dbad71b6cea700bf9e3c6cf866d0f0fdc22b44a0ebf51a860799e880ef86266199931dd0a301e5552db44b9b7fa99ed5945652bc7b31eff767c, '2020-02-20 16:05:47', 1, 0, 'de', 0, 1); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `description`) VALUES"
		<< "(1, 'gdd1', 'Gradido1', 'gdd1.gradido.com', 'Der erste offizielle Gradido Server (zum Testen)'), "
	    << "(2, 'gdd_test', 'Gradido Test', 'gdd1.gradido.com', 'Testgroup (zum Testen)'); ";
	runMysql(ss.str());
	ss.str(std::string());

	

	printf("init db in : %s\n", timeUsed.string().data());
	
	
	fillTests();
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		std::clog << "call init on test: " << (*it)->getName() << std::endl;
		if ((*it)->init()) printf("Fehler bei Init test: %s\n", (*it)->getName());
	}
	return 0;
}

int run()
{
	std::clog << "[Gradido_LoginServer_Test::run]" << std::endl;
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		//printf("running: %s\n", it->getName());
		printf("running test: %s\n", (*it)->getName());
		try {
			if (!(*it)->test()) printf("success\n");
		} catch(std::exception& ex) {
			std::clog << "exception in running test: " << ex.what() << std::endl;
		}
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
	try {
		if (load(argc, argv) < 0) {
			printf("early exit\n");
			return -42;
		}
	} catch(std::exception& ex) {
		printf("no catched exception while loading: %s\n", ex.what());
	}
	
  	//printf ("\nStack Limit = %ld and %ld max\n", limit.rlim_cur, limit.rlim_max);

	run();
	ende();
	::testing::InitGoogleTest(&argc, argv);

	auto result = RUN_ALL_TESTS();
	ServerConfig::unload();
	return result;
}
