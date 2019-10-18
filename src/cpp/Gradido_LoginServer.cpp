#include "Gradido_LoginServer.h"
#include "ServerConfig.h"
#include "HTTPInterface/PageRequestHandlerFactory.h"

#include "model/Profiler.h"

#include "SingletonManager/ConnectionManager.h"
#include "SingletonManager/SessionManager.h"


#include "Poco/Util/HelpFormatter.h"
#include "Poco/Net/ServerSocket.h"
#include "Poco/Net/HTTPServer.h"
#include "Poco/Net/SSLManager.h"
#include "Poco/Environment.h"
#include "Poco/Logger.h"
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
	helpFormatter.setHeader("A web server that shows how to work with HTML forms.");
	helpFormatter.format(std::cout);
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
		unsigned short port = (unsigned short)config().getInt("HTTPServer.port", 9980);
	
		// load word lists
		if (!ServerConfig::loadMnemonicWordLists()) {
			printf("[Gradido_LoginServer::%s] error loading mnemonic Word List\n", __FUNCTION__);
			return Application::EXIT_CONFIG;
		}
		if (!ServerConfig::initServerCrypto(config())) {
			printf("[Gradido_LoginServer::%s] error init server crypto\n", __FUNCTION__);
			return Application::EXIT_CONFIG;
		}

		ServerConfig::initEMailAccount(config());

		// start cpu scheduler
		uint8_t worker_count = Poco::Environment::processorCount() * 2;

		// init speed logger
		Poco::AutoPtr<Poco::SimpleFileChannel> speedLogFileChannel(new Poco::SimpleFileChannel("speedLog.txt"));
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
			printf("[Gradido_LoginServer::%s] error init server SSL Client\n", __FUNCTION__);
			return Application::EXIT_CONFIG;
		}

		// logging for request handling
		Poco::AutoPtr<Poco::ConsoleChannel> requestLogConsoleChannel(new Poco::ConsoleChannel);
		Poco::AutoPtr<Poco::SimpleFileChannel> requestLogFileChannel(new Poco::SimpleFileChannel("requestLog.txt"));
		requestLogFileChannel->setProperty("rotation", "500 K");
		Poco::AutoPtr<Poco::SplitterChannel> requestLogSplitter(new Poco::SplitterChannel);
		requestLogSplitter->addChannel(requestLogConsoleChannel);
		requestLogSplitter->addChannel(requestLogFileChannel);

		Poco::AutoPtr<Poco::AsyncChannel> requestLogAsyncChannel(new Poco::AsyncChannel(requestLogSplitter));
		
		Poco::Logger& requestLog = Poco::Logger::get("requestLog");
		requestLog.setChannel(requestLogAsyncChannel);
		requestLog.setLevel("information");

		// set-up a server socket
		Poco::Net::ServerSocket svs(port);
		// set-up a HTTPServer instance
		Poco::ThreadPool& pool = Poco::ThreadPool::defaultPool();
		Poco::Net::HTTPServer srv(new PageRequestHandlerFactory, svs, new Poco::Net::HTTPServerParams);
		// start the HTTPServer
		srv.start();
		printf("[Gradido_LoginServer::main] started in %s\n", usedTime.string().data());
		// wait for CTRL-C or kill
		waitForTerminationRequest();

		// Stop the HTTPServer
		srv.stop();
		ServerConfig::unload();
		Poco::Net::uninitializeSSL();
	}
	return Application::EXIT_OK;
}

