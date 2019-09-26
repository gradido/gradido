#include "Gradido_LoginServer.h"
#include "ServerConfig.h"
#include "HTTPInterface/PageRequestHandlerFactory.h"


#include "SingletonManager/ConnectionManager.h"
#include "SingletonManager/SessionManager.h"

#include "Poco/Util/HelpFormatter.h"
#include "Poco/Net/ServerSocket.h"
#include "Poco/Net/HTTPServer.h"
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
	if (_helpRequested)
	{
		displayHelp();
	}
	else
	{
		unsigned short port = (unsigned short)config().getInt("HTTPServer.port", 9980);

		// load word lists
		ServerConfig::loadMnemonicWordLists();

		// load up connection configs
		// register MySQL connector
		Poco::Data::MySQL::Connector::registerConnector();
		//Poco::Data::MySQL::Connector::KEY;
		auto conn = ConnectionManager::getInstance();
		//conn->setConnection()
		conn->setConnectionsFromConfig(config(), CONNECTION_MYSQL_LOGIN_SERVER);
		conn->setConnectionsFromConfig(config(), CONNECTION_MYSQL_PHP_SERVER);

		SessionManager::getInstance()->init();
		// put urandom on linux servers
		//srand();

		// set-up a server socket
		Poco::Net::ServerSocket svs(port);
		// set-up a HTTPServer instance
		Poco::Net::HTTPServer srv(new PageRequestHandlerFactory, svs, new Poco::Net::HTTPServerParams);
		// start the HTTPServer
		srv.start();
		// wait for CTRL-C or kill
		waitForTerminationRequest();
		// Stop the HTTPServer
		srv.stop();
	}
	return Application::EXIT_OK;
}

