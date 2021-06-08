#include "ConnectionManager.h"
#include <sstream>

ConnectionManager* ConnectionManager::getInstance()
{
	static ConnectionManager only;
	return &only;
}


ConnectionManager::ConnectionManager()
{

}

ConnectionManager::~ConnectionManager()
{

}

bool ConnectionManager::setConnectionsFromConfig(const Poco::Util::LayeredConfiguration& config, ConnectionType type)
{
	/*
	phpServer.url = 127.0.0.1:80/gradido_php
	phpServer.db.host = localhost
	phpServer.db.name = cake_gradido_node
	phpServer.db.user = root
	phpServer.db.password =
	phpServer.db.port = 3306

	loginServer.url =
	loginServer.db.host = localhost
	loginServer.db.name = gradido_login
	loginServer.db.user = gradido_login
	loginServer.db.password = hj2-sk28sKsj8(u_ske
	loginServer.db.port = 3306
	*/

	/*
	connectionString example: host=localhost;port=3306;db=mydb;user=alice;password=s3cr3t;compress=true;auto-reconnect=true
	*/
	std::string firstKeyPart;
	switch (type) {
	case CONNECTION_MYSQL_LOGIN_SERVER: firstKeyPart = "loginServer"; break;
	case CONNECTION_MYSQL_PHP_SERVER: firstKeyPart = "phpServer"; break;
	default: addError(new Error(__FUNCTION__, "type invalid")); return false;
	}
	std::stringstream dbConfig;
	dbConfig << "host=" << config.getString(firstKeyPart + ".db.host", "localhost") << ";";
	dbConfig << "port=" << config.getInt(firstKeyPart + ".db.port", 3306) << ";";
	std::string dbName = config.getString(firstKeyPart + ".db.name", "");
	if (dbName == "") {
		addError(new Error(__FUNCTION__, "no db name given")); 
		return false;
	}
	dbConfig << "db=" << dbName << ";";
	dbConfig << "user=" << config.getString(firstKeyPart + ".db.user", "root") << ";";
	dbConfig << "password=" << config.getString(firstKeyPart + ".db.password", "") << ";";
	dbConfig << "auto-reconnect=true";
	std::clog << "try connect with: " << dbConfig.str() << std::endl;

	setConnection(dbConfig.str(), type);

	return true;

}

Poco::Data::Session ConnectionManager::getConnection(ConnectionType type) 
{
	Poco::ScopedLock<Poco::FastMutex> _lock(mWorkingMutex);

	if (CONNECTION_MYSQL_LOGIN_SERVER != type && CONNECTION_MYSQL_PHP_SERVER != type) {
		addError(new ParamError("[ConnectionManager::getConnection]", "Connection Type unknown", std::to_string(type)));
		throw Poco::NotFoundException("Connection Type unknown", std::to_string(type));
	}
	auto session = mSessionPools.getPool(mSessionPoolNames[type]).get();

	//return mSessionPoolNames[type];
	if (!session.isConnected()) {
		printf("reconnect called\n");
		try {
			session.reconnect();
		}
		catch (Poco::Exception& e) {
			addError(new ParamError("[ConnectionManager::getConnection]", "reconnect throw exception, try with next new one, without further check", e.displayText()));
			sendErrorsAsEmail();
			return mSessionPools.getPool(mSessionPoolNames[type]).get();
		}

	}//*/
	//std::string dateTimeString = Poco::DateTimeFormatter::format(Poco::DateTime(), "%d.%m.%y %H:%M:%S");
	//printf("[getConnection] %s impl: %p\n", dateTimeString.data(), session.impl());
	return session;
}