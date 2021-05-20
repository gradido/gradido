
#include "main.h"
#include <list>
#include "gtest/gtest.h"

#include "Poco/Util/PropertyFileConfiguration.h"
#include "Poco/Environment.h"

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

int load() {
	// init server config, init seed array

	Poco::AutoPtr<Poco::Util::LayeredConfiguration> test_config(new Poco::Util::LayeredConfiguration);
	try {
		auto cfg = new Poco::Util::PropertyFileConfiguration("Gradido_LoginServer_Test.properties");
		test_config->add(cfg);
	}
	catch (Poco::Exception& ex) {
		printf("[load] error loading Gradido_LoginServer_Test.properties, make sure this file exist! (%s)\n", ex.displayText().data());
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
	try {
        conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_LOGIN_SERVER);
    } catch(Poco::Exception& ex) {
        printf("Poco Exception by connecting to db: %s\n", ex.displayText().data());
    }
	//printf("try connect php server mysql \n");
	//conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_PHP_SERVER);

	Profiler timeUsed;

	// clean up and fill db
	std::string tables[] = {
		"hedera_accounts",
		"hedera_ids",
		"crypto_keys",
		"hedera_topics",
		"groups",
		"node_servers",
		"users"
	};
	for (int i = 0; i < 7; i++) {
		runMysql("TRUNCATE " + tables[i]);
		runMysql("ALTER TABLE " + tables[i] + " AUTO_INCREMENT = 1");
	}

	std::stringstream ss;
	ss << "INSERT INTO `hedera_ids` (`id`, `shardNum`, `realmNum`, `num`) VALUES "
		<< "(1, 0, 0, 37281), "
		<< "(2, 0, 0, 21212), "
		<< "(3, 0, 0, 212);";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `crypto_keys` (`id`, `private_key`, `public_key`, `crypto_key_type_id`) VALUES "
		<< "(1, 0x263f1da712c3b47286b463c2de3784f364f2534d2c34722a3b483c3f3e36476857564f564d476c32d3e342f5ef2763cd23e23a2b429bab62e352f46ba273e2f2, 0xfe5237c2d1ab1361b33163f15634e261c1d217ae32b327cbd88db8ebffedb271, 3), "
		<< "(2, 0x721f3e73e3263f1da712c3b47286b463c2de3784f364f2534d2c34722a3b483c3f3e36476857564f564d476c32d3e342f5ef2763cd23e23a2b429bab62e352f46ba273e2f2ef3264fe2452da62bc2739, 0xe3f253d1a2deb25362d2e374baf37bc1d3ef3781cfe1e127f3cd0abcdf372ea6, 1); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `hedera_accounts` (`id`, `user_id`, `account_hedera_id`, `account_key_id`, `balance`, `network_type`, `updated`) VALUES "
		<< "(1, 1, 1, 1, 1000000000000, 1, '2019-09-03 11:13:52'), "
		<< "(2, 1, 2, 2, 4312881211, 0, '2019-09-03 11:13:56'); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `hedera_topics` (`id`, `topic_hedera_id`, `name`, `auto_renew_account_hedera_id`, `auto_renew_period`, `group_id`, `admin_key_id`, `submit_key_id`, `current_timeout`, `sequence_number`, `updated`) VALUES "
		<< "(1, 3, 'gdd_test_topic', 1, 0, 1, NULL, NULL, '1999-12-31 23:00:00', 0, '2020-09-14 18:29:04'); ";
	runMysql(ss.str());
	ss.str(std::string());

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
	if (load() < 0) {
		printf("early exit\n");
		return -42;
	}
	run();
	ende();
	::testing::InitGoogleTest(&argc, argv);

	auto result = RUN_ALL_TESTS();
	ServerConfig::unload();
	return result;
}
