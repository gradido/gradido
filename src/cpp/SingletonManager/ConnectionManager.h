#ifndef GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CONNECTION_MANAGER_INCLUDE
#define GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CONNECTION_MANAGER_INCLUDE

#include "../lib/DRHashList.h"
#include <string>

#include "Poco/Util/LayeredConfiguration.h"
#include "Poco/Data/SessionPoolContainer.h"
#include "../MySQL/Poco/Connector.h"
#include "Poco/Exception.h"

#include "../lib/ErrorList.h"

enum ConnectionType {
	CONNECTION_MYSQL_LOGIN_SERVER,
	CONNECTION_MYSQL_PHP_SERVER,
	CONNECTION_MAX
};

class ConnectionManager : public ErrorList
{
public: 
	~ConnectionManager();

	static ConnectionManager* getInstance();

	bool setConnectionsFromConfig(const Poco::Util::LayeredConfiguration& config, ConnectionType type);

	//!  \param connectionString example: host=localhost;port=3306;db=mydb;user=alice;password=s3cr3t;compress=true;auto-reconnect=true
	inline void setConnection(std::string connectionString, ConnectionType type) {
		if (type == CONNECTION_MYSQL_LOGIN_SERVER || CONNECTION_MYSQL_PHP_SERVER) {
			mSessionPoolNames[type] = Poco::Data::Session::uri(Poco::Data::MySQL::Connector::KEY, connectionString);
			mSessionPools.add(Poco::Data::MySQL::Connector::KEY, connectionString, 1, 16);
			//mConnectionData[type] = connectionString;
		}
	}

	//! \brief return connection from pool, check if connected in if not, call reconnect on it
	//! 
	//! In the past I used auto-reconnect but it didn't work everytime as expectet
	Poco::Data::Session getConnection(ConnectionType type);

protected:
	ConnectionManager();

private:
	std::string mSessionPoolNames[CONNECTION_MAX];
	Poco::Data::SessionPoolContainer mSessionPools;
	Poco::FastMutex  mWorkingMutex;
};

#endif //GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CONNECTION_MANAGER_INCLUDE