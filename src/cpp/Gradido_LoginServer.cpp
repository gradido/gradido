#include "Gradido_LoginServer.h"
#include "ServerConfig.h"
#include "HTTPInterface/PageRequestHandlerFactory.h"
#include "JSONInterface/JsonRequestHandlerFactory.h"

#include "lib/Profiler.h"

#include "SingletonManager/ConnectionManager.h"
#include "SingletonManager/SessionManager.h"
#include "SingletonManager/EmailManager.h"

#include "Poco/Util/HelpFormatter.h"
#include "Poco/Net/ServerSocket.h"
#include "Poco/Net/HTTPServer.h"
#include "Poco/Net/SSLManager.h"
#include "Poco/Environment.h"
#include "Poco/Logger.h"
#include "Poco/Path.h"
#include "Poco/AsyncChannel.h"
#include "Poco/SimpleFileChannel.h"
#include "Poco/ConsoleChannel.h"
#include "Poco/SplitterChannel.h"
#include "MySQL/Poco/Connector.h"


#include <sodium.h>



Gradido_LoginServer::Gradido_LoginServer() 
	: _helpRequested(false)
{
}

Gradido_LoginServer::~Gradido_LoginServer()
{
}


void Gradido_LoginServer::initialize(Application& self)
{
	loadConfiguration(); // load default configuration files, if present
	ServerApplication::initialize(self);
}

void Gradido_LoginServer::uninitialize()
{
	ServerApplication::uninitialize();
}

void Gradido_LoginServer::defineOptions(Poco::Util::OptionSet& options)
{
	ServerApplication::defineOptions(options);

	options.addOption(
		Poco::Util::Option("help", "h", "display help information on command line arguments")
		.required(false)
		.repeatable(false));
}

void Gradido_LoginServer::handleOption(const std::string& name, const std::string& value)
{
	ServerApplication::handleOption(name, value);
	if (name == "help") _helpRequested = true;
}

void Gradido_LoginServer::displayHelp()
{
	Poco::Util::HelpFormatter helpFormatter(options());
	helpFormatter.setCommand(commandName());
	helpFormatter.setUsage("OPTIONS");
	helpFormatter.setHeader("Gradido Login Server");
	helpFormatter.format(std::cout);
}

void Gradido_LoginServer::createConsoleFileAsyncLogger(std::string name, std::string filePath)
{
	Poco::AutoPtr<Poco::ConsoleChannel> logConsoleChannel(new Poco::ConsoleChannel);
	Poco::AutoPtr<Poco::SimpleFileChannel> logFileChannel(new Poco::SimpleFileChannel(filePath));
	logFileChannel->setProperty("rotation", "500 K");
	Poco::AutoPtr<Poco::SplitterChannel> logSplitter(new Poco::SplitterChannel);
	logSplitter->addChannel(logConsoleChannel);
	logSplitter->addChannel(logFileChannel);

	Poco::AutoPtr<Poco::AsyncChannel> logAsyncChannel(new Poco::AsyncChannel(logSplitter));

	Poco::Logger& log = Poco::Logger::get(name);
	log.setChannel(logAsyncChannel);
	log.setLevel("information");
}

int Gradido_LoginServer::main(const std::vector<std::string>& args)
{
	Profiler usedTime;
	if (_helpRequested)
	{
		displayHelp();
	}
	else
	{
		// ********** logging ************************************
		std::string log_Path = "/var/log/grd_login/";
//#ifdef _WIN32
#if defined(_WIN32) || defined(_WIN64)
		log_Path = "./";
#endif

		// init speed logger
		Poco::AutoPtr<Poco::SimpleFileChannel> speedLogFileChannel(new Poco::SimpleFileChannel(log_Path + "speedLog.txt"));
		/*
		The optional log file rotation mode:
		never:      no rotation (default)
		<n>:  rotate if file size exceeds <n> bytes
		<n> K:     rotate if file size exceeds <n> Kilobytes
		<n> M:    rotate if file size exceeds <n> Megabytes
		*/
		speedLogFileChannel->setProperty("rotation", "500 K");
		Poco::AutoPtr<Poco::AsyncChannel> speedLogAsyncChannel(new Poco::AsyncChannel(speedLogFileChannel));

		Poco::Logger& speedLogger = Poco::Logger::get("SpeedLog");
		speedLogger.setChannel(speedLogAsyncChannel);
		speedLogger.setLevel("information");

		// logging for request handling
		createConsoleFileAsyncLogger("requestLog", log_Path + "requestLog.txt");

		// error logging
		createConsoleFileAsyncLogger("errorLog", log_Path + "errorLog.txt");
		Poco::Logger& errorLog = Poco::Logger::get("errorLog");

		// *************** load from config ********************************************

		std::string cfg_Path = Poco::Path::config() + "grd_login/";
		try {
			loadConfiguration(cfg_Path + "grd_login.properties");
		}
		catch (Poco::Exception& ex) {
			errorLog.error("error loading config: %s", ex.displayText());
		}

		unsigned short port = (unsigned short)config().getInt("HTTPServer.port", 9980);
		unsigned short json_port = (unsigned short)config().getInt("JSONServer.port", 1201);

	
		// load word lists
		if (!ServerConfig::loadMnemonicWordLists()) {
			//printf("[Gradido_LoginServer::%s] error loading mnemonic Word List\n", __FUNCTION__);
			errorLog.error("[Gradido_LoginServer::main] error loading mnemonic Word List");
			return Application::EXIT_CONFIG;
		}
		//printf("show mnemonic list: \n");
		//printf(ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER].getCompleteWordList().data());
		if (!ServerConfig::initServerCrypto(config())) {
			//printf("[Gradido_LoginServer::%s] error init server crypto\n", __FUNCTION__);
			errorLog.error("[Gradido_LoginServer::main] error init server crypto");
			return Application::EXIT_CONFIG;
		}

		Poco::Int64 i1 = randombytes_random();
		Poco::Int64 i2 = randombytes_random();
		ServerConfig::g_ServerKeySeed->put(1, i1 | (i2 << 8));

		ServerConfig::initEMailAccount(config());
		EmailManager::getInstance()->init(config());

		// start cpu scheduler
		uint8_t worker_count = Poco::Environment::processorCount() * 2;

		ServerConfig::g_CPUScheduler = new UniLib::controller::CPUSheduler(worker_count, "Default Worker");
		ServerConfig::g_CryptoCPUScheduler = new UniLib::controller::CPUSheduler(2, "Crypto Worker");

		// load up connection configs
		// register MySQL connector
		Poco::Data::MySQL::Connector::registerConnector();
		//Poco::Data::MySQL::Connector::KEY;
		auto conn = ConnectionManager::getInstance();
		//conn->setConnection()
		//printf("try connect login server mysql db\n");
		conn->setConnectionsFromConfig(config(), CONNECTION_MYSQL_LOGIN_SERVER);
		//printf("try connect php server mysql \n");
		conn->setConnectionsFromConfig(config(), CONNECTION_MYSQL_PHP_SERVER);

		SessionManager::getInstance()->init();
		// put urandom on linux servers
		//srand();

		Poco::Net::initializeSSL();
		if(!ServerConfig::initSSLClientContext()) {
			//printf("[Gradido_LoginServer::%s] error init server SSL Client\n", __FUNCTION__);
			errorLog.error("[Gradido_LoginServer::main] error init server SSL Client\n");
			return Application::EXIT_CONFIG;
		}

		

		// HTTP Interface Server
		// set-up a server socket
		Poco::Net::ServerSocket svs(port);
		// set-up a HTTPServer instance
		Poco::ThreadPool& pool = Poco::ThreadPool::defaultPool();
		Poco::Net::HTTPServer srv(new PageRequestHandlerFactory, svs, new Poco::Net::HTTPServerParams);
		ServerConfig::g_ServerKeySeed->put(7, 918276611);
		
		// start the HTTPServer
		srv.start();

		// JSON Interface Server
		Poco::Net::ServerSocket json_svs(json_port);
		Poco::Net::HTTPServer json_srv(new JsonRequestHandlerFactory, json_svs, new Poco::Net::HTTPServerParams);

		// start the json server
		json_srv.start();

		printf("[Gradido_LoginServer::main] started in %s\n", usedTime.string().data());
		// wait for CTRL-C or kill
		waitForTerminationRequest();

		// Stop the HTTPServer
		srv.stop();
		// Stop the json server
		json_srv.stop();

		ServerConfig::unload();
		Poco::Net::uninitializeSSL();
		// Optional:  Delete all global objects allocated by libprotobuf.
		google::protobuf::ShutdownProtobufLibrary();

	}
	return Application::EXIT_OK;
}

