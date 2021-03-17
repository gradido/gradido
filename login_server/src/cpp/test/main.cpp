
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
	gTests.push_back(new TestHash());
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
	conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_LOGIN_SERVER);
	//printf("try connect php server mysql \n");
	conn->setConnectionsFromConfig(*test_config, CONNECTION_MYSQL_PHP_SERVER);

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
	ss << "INSERT INTO `users` (`id`, `email`, `first_name`, `last_name`, `password`, `pubkey`, `privkey`, `created`, `email_checked`, `passphrase_shown`, `language`, `disabled`) VALUES "
		<< "(1, 'einhorn_silas@ist-allein.info', 'DDD', 'Schultz', 13134558453895551556, 0x146d3fb9e88abc0fca0b0091c1ab1b32b399be037436f340befa8bf004461889, 0x0dcc08960f45f631fe23bc7ddee0724cedc9ec0c861ce30f5091d20ffd96062d08ca215726fb9bd64860c754772e945eea4cc872ed0a36c7b640e8b0bf7a873ec6765fa510711622341347ce2307b5ce, '2020-02-20 16:05:44', 1, 0, 'de', 0), "
		<< "(2, 'Dario.Rekowski@buerotiger.de', 'Darios', 'Bruder', 12910944485867375321, 0x952e215a21d4376b4ac252c4bf41e156e1498e1b6b8ccf2a6826d96712f4f461, 0x4d40bf0860655f728312140dc3741e897bc2d13d00ea80a63e2961046a5a7bd8315397dfb488b89377087bc1a5f4f3af8ffdcf203329ae23ba04be7d38ad3852699d90ff1fc00e5b1ca92b64cc59c01f, '2020-02-20 16:05:44', 1, 0, 'de', 0), "
		<< "(3, 'morgenstern175@es-ist-liebe.de', 'Dieter', 'Schultz', 13528673707291575501, 0xb539944bf6444a2bfc988244f0c0c9dc326452be9b8a2a43fcd90663719f4f6d, 0x5461fda60b719b65ba00bd6298e48410c4cbf0e89deb13cc784ba8978cf047454e8556ee3eddc8487ee835c33a83163bc8d8babbf2a5c431876bc0a0c114ff0a0d6b57baa12cf8f23c64fb642c862db5, '2020-02-20 16:05:45', 1, 0, 'de', 0), "
		<< "(4, 'spaceteam@gmx.de', 'Bernd', 'Hückstädt', 15522411320147607375, 0x476b059744f08b0995522b484c90f8d2f47d9b59f4b3c96d9dc0ae6ab7b84979, 0x5277bf044cba4fec64e6f4d38da132755b029161231daefc9a7b4692ad37e05cdd88e0a2c2215baf854dd3a813578c214167af1113607e9f999ca848a7598ba5068e38f2a1afb097e4752a88024d79c8, '2020-02-20 16:05:46', 1, 0, 'de', 0), "
		<< "(5, 'em741@gmx.de', 'Thomas', 'Markuk', 7022671043835614958, 0xb1584e169d60a7e771d3a348235dfd7b5f9e8235fcc26090761a0264b0daa6ff, 0xb46fb7110bf91e28f367aa80f84d1bbd639b6f689f4b0aa28c0f71529232df9bf9ee0fb02fa4c1b9f5a6799c82d119e5646f7231d011517379faaacf6513d973ac3043d4c786490ba62d56d75b86164d, '2020-02-20 16:05:46', 1, 0, 'de', 0), "
		<< "(6, 'coin-info12@gradido.net', 'coin-info12', 'Test', 1548398919826089202, 0x4046ae49c1b620f2a321aba0c874fa2bc7ba844ab808bb0eeb18a908d468db14, 0x9522657ecd7456eedf86d065aa087ba7a94a8961a8e4950d044136155d38fe0840f2c0a2876ce055b3eaa6e9ab95c5feba89e535e0434fb2648d94d6e6ec68211aa2ea9e42d1ccd40b6b3c31e41f848e, '2020-02-20 16:05:47', 1, 0, 'de', 0), "
		<< "(7, 'info@einhornimmond.de', 'Alex', 'Wesper', 5822761891727948301, 0xb13ede3402abb8f29722b14fec0a2006ae7a3a51fb677cd6a2bbd797ac6905a5, 0x6aa39d7670c64a31639c7d89b874ad929b2eaeb2e5992dbad71b6cea700bf9e3c6cf866d0f0fdc22b44a0ebf51a860799e880ef86266199931dd0a301e5552db44b9b7fa99ed5945652bc7b31eff767c, '2020-02-20 16:05:47', 1, 0, 'de', 0); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `description`) VALUES "
		<< "(1, 'gdd1', 'Gradido1', 'gdd1.gradido.com', 'Der erste offizielle Gradido Server (zum Testen)'); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `hedera_accounts` (`id`, `user_id`, `account_hedera_id`, `account_key_id`, `balance`, `network_type`, `updated`) VALUES "
		<< "(1, 2, 15, 1, 1000000000000, 1, '2020-09-03 11:13:52'), "
		<< "(2, 2, 17, 2, 22787166159, 0, '2020-09-03 11:13:56'); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `hedera_ids` (`id`, `shardNum`, `realmNum`, `num`) VALUES "
		<< "(1, 0, 0, 3), "
		<< "(2, 0, 0, 4),"
		<< "(3, 0, 0, 5),"
		<< "(4, 0, 0, 6),"
		<< "(6, 0, 0, 3),"
		<< "(10, 0, 0, 7),"
		<< "(11, 0, 0, 8),"
		<< "(12, 0, 0, 9),"
		<< "(13, 0, 0, 10),"
		<< "(14, 0, 0, 12),"
		<< "(15, 0, 0, 3327),"
		<< "(16, 0, 0, 3323),"
		<< "(17, 0, 0, 8707),"
		<< "(18, 0, 0, 39446);";
	runMysql(ss.str());
	ss.str(std::string());
	
	ss << "INSERT INTO `crypto_keys` (`id`, `private_key`, `public_key`, `crypto_key_type_id`) VALUES "
		<< "(1, 0xd2d4735174e6d2577573a0ec2767fba6511b1e37cd1cd98674912797fd37e12373d6b4d771034cc114f80b2afb2956b6b3e020ddea2db1142c61f3fa87c72a6c, 0x73d6b4d771034cc114f80b2afb2956b6b3e020ddea2db1142c61f3fa87c72a6c, 3), "
		<< "(2, 0xf1c3285be6ef869a2a8deef6caee56a5a7c2660e2bce24f39e420dd8d42fe8894bd027b2799e46dc7111a4fdd0eac3848054331f844a358de15c5b0ed3eb1740fab13ecb5a271d480e040c9266bcd584, 0xd6f6d29fb277f86ac7c3098dc799028974223e8dce6b1dd57b03940bf35fae7f, 1); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `hedera_topics` (`id`, `topic_hedera_id`, `name`, `auto_renew_account_hedera_id`, `auto_renew_period`, `group_id`, `admin_key_id`, `submit_key_id`, `current_timeout`, `sequence_number`, `updated`) VALUES "
		<< "(1, 18, 'from Pauls created with his python script', 1, 0, 1, NULL, NULL, '1999-12-31 23:00:00', 0, '2020-09-14 18:29:04'); ";
	runMysql(ss.str());
	ss.str(std::string());

	ss << "INSERT INTO `node_servers` (`id`, `url`, `port`, `group_id`, `server_type`, `node_hedera_id`, `last_live_sign`) VALUES "
		<< "(1, 'http://0.testnet.hedera.com', 50211, 0, 4, 1, '2000-01-01 00:00:00'), "
		<< "(2, 'http://1.testnet.hedera.com', 50211, 0, 4, 2, '2000-01-01 00:00:00'), "
		<< "(3, 'http://2.testnet.hedera.com', 50211, 0, 4, 3, '2000-01-01 00:00:00'), "
		<< "(4, 'http://3.testnet.hedera.com', 50211, 0, 4, 4, '2000-01-01 00:00:00'), "
		<< "(5, 'http://35.237.200.180', 50211, 0, 3, 6, '2000-01-01 00:00:00'), "
		<< "(6, 'http://35.186.191.247', 50211, 0, 3, 2, '2000-01-01 00:00:00'), "
		<< "(7, 'http://35.192.2.25', 50211, 0, 3, 3, '2000-01-01 00:00:00'), "
		<< "(8, 'http://35.199.161.108', 50211, 0, 3, 4, '2000-01-01 00:00:00'), "
		<< "(9, 'http://35.203.82.240', 50211, 0, 3, 10, '2000-01-01 00:00:00'), "
		<< "(10, 'http://35.236.5.219', 50211, 0, 3, 11, '2000-01-01 00:00:00'), "
		<< "(11, 'http://35.197.192.225', 50211, 0, 3, 12, '2000-01-01 00:00:00'), "
		<< "(12, 'http://35.242.233.154', 50211, 0, 3, 13, '2000-01-01 00:00:00'), "
		<< "(13, 'http://35.240.118.96', 50211, 0, 3, 12, '2000-01-01 00:00:00'), "
		<< "(14, 'http://35.204.86.32', 50211, 0, 3, 14, '2000-01-01 00:00:00'), "
		<< "(15, 'https://gradido.dario-rekowski.de/', 443, 1, 2, 0, '2000-01-01 00:00:00'), "
		<< "(16, 'http://192.168.178.232', 8340, 1, 1, 0, '2000-01-01 00:00:00'); ";
	runMysql(ss.str());

	printf("init db in : %s\n", timeUsed.string().data());
	
	/*mysqlStatement
		<< "TRUNCATE hedera_accounts; "
		<< "ALTER TABLE hedera_accounts AUTO_INCREMENT = 1; "
		<< "TRUNCATE hedera_ids; "
		<< "ALTER TABLE hedera_ids AUTO_INCREMENT = 1; "
		<< "TRUNCATE crypto_keys; "
		<< "ALTER TABLE crypto_keys AUTO_INCREMENT = 1; "
		<< "TRUNCATE hedera_topics; "
		<< "ALTER TABLE hedera_topics AUTO_INCREMENT = 1; "
		<< "TRUNCATE groups; "
		<< "ALTER TABLE groups AUTO_INCREMENT = 1; "
		<< "TRUNCATE node_servers; "
		<< "ALTER TABLE node_servers AUTO_INCREMENT = 1; "
		<< "TRUNCATE users; "
		<< "ALTER TABLE users AUTO_INCREMENT = 1; "
		;

	try {
		mysqlStatement.execute(true);
	}
	catch (Poco::Exception& ex) {
		printf("exception by cleaning up db: %s\n", ex.displayText().data());
	}
	mysqlStatement.reset(session);
	mysqlStatement 
		<< "INSERT INTO `users` (`id`, `email`, `first_name`, `last_name`, `password`, `pubkey`, `privkey`, `created`, `email_checked`, `passphrase_shown`, `language`, `disabled`) VALUES "
		<< "(1, 'einhorn_silas@ist-allein.info', 'DDD', 'Schultz', 13134558453895551556, 0x146d3fb9e88abc0fca0b0091c1ab1b32b399be037436f340befa8bf004461889, 0x0dcc08960f45f631fe23bc7ddee0724cedc9ec0c861ce30f5091d20ffd96062d08ca215726fb9bd64860c754772e945eea4cc872ed0a36c7b640e8b0bf7a873ec6765fa510711622341347ce2307b5ce, '2020-02-20 16:05:44', 1, 0, 'de', 0), "
		<< "(2, 'Dario.Rekowski@buerotiger.de', 'Darios', 'Bruder', 12910944485867375321, 0x952e215a21d4376b4ac252c4bf41e156e1498e1b6b8ccf2a6826d96712f4f461, 0x4d40bf0860655f728312140dc3741e897bc2d13d00ea80a63e2961046a5a7bd8315397dfb488b89377087bc1a5f4f3af8ffdcf203329ae23ba04be7d38ad3852699d90ff1fc00e5b1ca92b64cc59c01f, '2020-02-20 16:05:44', 1, 0, 'de', 0), "
		<< "(3, 'morgenstern175@es-ist-liebe.de', 'Dieter', 'Schultz', 13528673707291575501, 0xb539944bf6444a2bfc988244f0c0c9dc326452be9b8a2a43fcd90663719f4f6d, 0x5461fda60b719b65ba00bd6298e48410c4cbf0e89deb13cc784ba8978cf047454e8556ee3eddc8487ee835c33a83163bc8d8babbf2a5c431876bc0a0c114ff0a0d6b57baa12cf8f23c64fb642c862db5, '2020-02-20 16:05:45', 1, 0, 'de', 0), "
		<< "(4, 'spaceteam@gmx.de', 'Bernd', 'Hückstädt', 15522411320147607375, 0x476b059744f08b0995522b484c90f8d2f47d9b59f4b3c96d9dc0ae6ab7b84979, 0x5277bf044cba4fec64e6f4d38da132755b029161231daefc9a7b4692ad37e05cdd88e0a2c2215baf854dd3a813578c214167af1113607e9f999ca848a7598ba5068e38f2a1afb097e4752a88024d79c8, '2020-02-20 16:05:46', 1, 0, 'de', 0), "
		<< "(5, 'em741@gmx.de', 'Thomas', 'Markuk', 7022671043835614958, 0xb1584e169d60a7e771d3a348235dfd7b5f9e8235fcc26090761a0264b0daa6ff, 0xb46fb7110bf91e28f367aa80f84d1bbd639b6f689f4b0aa28c0f71529232df9bf9ee0fb02fa4c1b9f5a6799c82d119e5646f7231d011517379faaacf6513d973ac3043d4c786490ba62d56d75b86164d, '2020-02-20 16:05:46', 1, 0, 'de', 0), "
		<< "(6, 'coin-info12@gradido.net', 'coin-info12', 'Test', 1548398919826089202, 0x4046ae49c1b620f2a321aba0c874fa2bc7ba844ab808bb0eeb18a908d468db14, 0x9522657ecd7456eedf86d065aa087ba7a94a8961a8e4950d044136155d38fe0840f2c0a2876ce055b3eaa6e9ab95c5feba89e535e0434fb2648d94d6e6ec68211aa2ea9e42d1ccd40b6b3c31e41f848e, '2020-02-20 16:05:47', 1, 0, 'de', 0), "
		<< "(7, 'info@einhornimmond.de', 'Alex', 'Wesper', 5822761891727948301, 0xb13ede3402abb8f29722b14fec0a2006ae7a3a51fb677cd6a2bbd797ac6905a5, 0x6aa39d7670c64a31639c7d89b874ad929b2eaeb2e5992dbad71b6cea700bf9e3c6cf866d0f0fdc22b44a0ebf51a860799e880ef86266199931dd0a301e5552db44b9b7fa99ed5945652bc7b31eff767c, '2020-02-20 16:05:47', 1, 0, 'de', 0); "

		<< "INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `description`) VALUES "
		<< "(1, 'gdd1', 'Gradido1', 'gdd1.gradido.com', 'Der erste offizielle Gradido Server (zum Testen)'); "

		<< "INSERT INTO `hedera_accounts` (`id`, `user_id`, `account_hedera_id`, `account_key_id`, `balance`, `network_type`, `updated`) VALUES "
		<< "(1, 2, 15, 1, 1000000000000, 1, '2020-09-03 11:13:52'), "
		<< "(2, 2, 17, 2, 22787166159, 0, '2020-09-03 11:13:56'); "

		<< "INSERT INTO `hedera_ids` (`id`, `shardNum`, `realmNum`, `num`) VALUES "
		<< "(1, 0, 0, 3), " 
		<< "(2, 0, 0, 4),"
		<< "(3, 0, 0, 5),"
		<< "(4, 0, 0, 6),"
		<< "(6, 0, 0, 3),"
		<< "(10, 0, 0, 7),"
		<< "(11, 0, 0, 8),"
		<< "(12, 0, 0, 9),"
		<< "(13, 0, 0, 10),"
		<< "(14, 0, 0, 12),"
		<< "(15, 0, 0, 3327),"
		<< "(16, 0, 0, 3323),"
		<< "(17, 0, 0, 8707),"
		<< "(18, 0, 0, 39446);"

		<< "INSERT INTO `crypto_keys` (`id`, `private_key`, `public_key`, `crypto_key_type_id`) VALUES "
		<< "(1, 0xd2d4735174e6d2577573a0ec2767fba6511b1e37cd1cd98674912797fd37e12373d6b4d771034cc114f80b2afb2956b6b3e020ddea2db1142c61f3fa87c72a6c, 0x73d6b4d771034cc114f80b2afb2956b6b3e020ddea2db1142c61f3fa87c72a6c, 3), "
		<< "(2, 0xf1c3285be6ef869a2a8deef6caee56a5a7c2660e2bce24f39e420dd8d42fe8894bd027b2799e46dc7111a4fdd0eac3848054331f844a358de15c5b0ed3eb1740fab13ecb5a271d480e040c9266bcd584, 0xd6f6d29fb277f86ac7c3098dc799028974223e8dce6b1dd57b03940bf35fae7f, 1); "

		<< "INSERT INTO `hedera_topics` (`id`, `topic_hedera_id`, `name`, `auto_renew_account_hedera_id`, `auto_renew_period`, `group_id`, `admin_key_id`, `submit_key_id`, `current_timeout`, `sequence_number`, `updated`) VALUES "
		<< "(1, 18, 'from Pauls created with his python script', 1, 0, 1, NULL, NULL, '1999-12-31 23:00:00', 0, '2020-09-14 18:29:04'); "

		<< "INSERT INTO `node_servers` (`id`, `url`, `port`, `group_id`, `server_type`, `node_hedera_id`, `last_live_sign`) VALUES "
		<< "(1, 'http://0.testnet.hedera.com', 50211, 0, 4, 1, '2000-01-01 00:00:00'), "
		<< "(2, 'http://1.testnet.hedera.com', 50211, 0, 4, 2, '2000-01-01 00:00:00'), "
		<< "(3, 'http://2.testnet.hedera.com', 50211, 0, 4, 3, '2000-01-01 00:00:00'), "
		<< "(4, 'http://3.testnet.hedera.com', 50211, 0, 4, 4, '2000-01-01 00:00:00'), "
		<< "(5, 'http://35.237.200.180', 50211, 0, 3, 6, '2000-01-01 00:00:00'), "
		<< "(6, 'http://35.186.191.247', 50211, 0, 3, 2, '2000-01-01 00:00:00'), "
		<< "(7, 'http://35.192.2.25', 50211, 0, 3, 3, '2000-01-01 00:00:00'), "
		<< "(8, 'http://35.199.161.108', 50211, 0, 3, 4, '2000-01-01 00:00:00'), "
		<< "(9, 'http://35.203.82.240', 50211, 0, 3, 10, '2000-01-01 00:00:00'), "
		<< "(10, 'http://35.236.5.219', 50211, 0, 3, 11, '2000-01-01 00:00:00'), "
		<< "(11, 'http://35.197.192.225', 50211, 0, 3, 12, '2000-01-01 00:00:00'), "
		<< "(12, 'http://35.242.233.154', 50211, 0, 3, 13, '2000-01-01 00:00:00'), "
		<< "(13, 'http://35.240.118.96', 50211, 0, 3, 12, '2000-01-01 00:00:00'), "
		<< "(14, 'http://35.204.86.32', 50211, 0, 3, 14, '2000-01-01 00:00:00'), "
		<< "(15, 'https://gradido.dario-rekowski.de/', 443, 1, 2, 0, '2000-01-01 00:00:00'), "
		<< "(16, 'http://192.168.178.232', 8340, 1, 1, 0, '2000-01-01 00:00:00'); "
		;

	try {
		mysqlStatement.execute();
	}
	catch (Poco::Exception& ex) {
		printf("exception by init db with data: %s\n", ex.displayText().data());
	}
	*/
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
