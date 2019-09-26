#include "ConnectionManager.h"
#include "../Connections/MysqlConnection.h"
#include <sstream>


ConnectThread::ConnectThread(ConnectionManager* parent)
	: Thread(true), initMysqlThread(false), mParent(parent)
{

}

ConnectThread::~ConnectThread()
{
	
}

int ConnectThread::ThreadFunction()
{
	if (!initMysqlThread) {
		if(mysql_thread_init()) {
			printf("error by calling mysql thread init\n");
		}
		initMysqlThread = true;
	}
	mDataMutex.lock();

	// clean up not longer used connections
	while (mConnectionWaitingOnDestroy.size() > 0) {
		auto con = mConnectionWaitingOnDestroy.front();
		mConnectionWaitingOnDestroy.pop();
		mDataMutex.unlock();
		delete con;
		mDataMutex.lock();
	}

	// creating new connections
	while(mConnectionsWaitingOnConnectCall.size() > 0) {
		auto con = mConnectionsWaitingOnConnectCall.front();
		mConnectionsWaitingOnConnectCall.pop();
		mDataMutex.unlock();
		if(!con->connect()) {
			//printf("[ConnectThread::ThreadFunction] error connecting with type: %s\n",
				//Connection::getConnectionTypeName(con->getType()));
		};
		mParent->markAsAvailable(con);
		mParent->condSignal();
		mDataMutex.lock();
	}
	mDataMutex.unlock();

	return 0;
}

void ConnectThread::cleanUpInThread()
{
	if (initMysqlThread) {
		mysql_thread_end();
		initMysqlThread = false;
	}
}

void ConnectThread::addConnectionConnect(Connection* connection)
{
	mDataMutex.lock();
	mConnectionsWaitingOnConnectCall.push(connection);
	mDataMutex.unlock();
}


void ConnectThread::addConnectionDestroy(Connection* connection)
{
	mDataMutex.lock();
	mConnectionWaitingOnDestroy.push(connection);
	mDataMutex.unlock();
}

// -----------------------------------------------------------------
//			ConnectionManager
// -----------------------------------------------------------------

ConnectionManager* ConnectionManager::getInstance()
{
	static ConnectionManager only;
	return &only;
}

ConnectionManager::ConnectionManager()
	: mConnectionEstablishThread(this), mInitalized(true)
{

}

ConnectionManager::~ConnectionManager()
{
	if (mInitalized) {
		deinitalize();
	}
}

void ConnectionManager::deinitalize()
{
	lock();
	mInitalized = false;
	unlock();
	
	mConnectionEstablishThread.exitThread();
	
	for (auto it = mConnections.begin(); it != mConnections.end(); it++)
	{
		auto freeConnections = it->second->mFreeConnections;
		while (freeConnections.size() > 0) {
			delete freeConnections.top();
			freeConnections.pop();
		}
		auto cfg_ptr = it->second->cfg_ptr;
		cfg_ptr->removeRef();
		if (cfg_ptr->getRef() <= 0) {
			delete cfg_ptr;
		}
	}
	mConnections.clear();
	mInitalized = false;
	
}

bool ConnectionManager::addConnectionPool(DRSimpleResourcePtr<Config>* cfg_ptr)
{
	if (!mInitalized) {
		printf("[ConnectionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}
	if ((*cfg_ptr)->name == std::string("")) {
		// getConnectionTypeName
		ConnectionConfig* cfg = static_cast<ConnectionConfig*>((Config*)(*cfg_ptr));
		(*cfg_ptr)->name = "Connect_";
		(*cfg_ptr)->name += Connection::getConnectionTypeName(cfg->type);
		if (cfg->type == CONN_MYSQL) {
			DBConnectionConfig* db_cfg = static_cast<DBConnectionConfig*>((Config*)(*cfg_ptr));
			(*cfg_ptr)->name += "_";
			(*cfg_ptr)->name += db_cfg->db;
		}
	}

	DHASH id = (*cfg_ptr)->getHash();
	
	// check if collision
	lock();
	if (!mInitalized) {
		printf("[ConnectionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}

	auto it = mConnections.find(id);
	if (it != mConnections.end()) {
		unlock();
		if ((*it->second->cfg_ptr)->name == (*cfg_ptr)->name) {
			printf("connection %s already in there: %s\n", (*cfg_ptr)->name.data(), __FUNCTION__);
			return false;
		}
		else {
			printf("Hash Collision detected with %s and %s in %s\n",
				(*cfg_ptr)->name.data(), (*it->second->cfg_ptr)->name.data(), __FUNCTION__);
			return false;
		}
	}
	unlock();
	// try to create connection object
	
	auto con = createConnection(cfg_ptr);
	if (!con) {
		printf("couldn't create connection with cfg: %s\n", (*cfg_ptr)->name.data());
		return false;
	}
	// create pool 
	auto pool = new ConnectionPool;
	//pool->cfg = cfg;
	pool->cfg_ptr = cfg_ptr;
	pool->cfg_ptr->addRef();
	printf("create new connection pool for connection: %s\n", (*cfg_ptr)->name.data());

	lock();
	if (!mInitalized) {
		printf("[ConnectionManager::%s] not initialized any more\n", __FUNCTION__);
		return false;
	}

	mConnections.insert(std::pair<int, ConnectionPool*>(id, pool));
	
	unlock();

	// start connection
	if(con) {
		mConnectionEstablishThread.addConnectionConnect(con);
		mConnectionEstablishThread.condSignal();
	}
	
	
	return true;
}

bool ConnectionManager::markAsAvailable(Connection* con)
{
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return false;
	}

	DHASH id = con->getHash();
	lock();
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return false;
	}

	auto it = mConnections.find(id);
	if (it == mConnections.end()) {
		addError(new ParamError(__FUNCTION__, "couldn't find connection pool for id:", id));
		delete con;
		unlock();
		return false;
	}
	else if (!con->isOpen()) {
		if (con->errorCount() > 0) {
			it->second->mErrorConnectingAttempts++;
			addError(new ParamError(__FUNCTION__, "connection wasn't open and has errors, failed connecting attempt: ", it->second->mErrorConnectingAttempts));
			getErrors(con);
			unlock();
			return false;
		}
	}
	it->second->mFreeConnections.push(con);
	checkTime(it->second);

	unlock();
	return true;
}

void ConnectionManager::checkTime(ConnectionPool* pool)
{
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return;
	}

	auto currentSize = pool->mFreeConnections.size();
	// (re)start timer if at least three unused connections reached
	if (pool->mFreeConnectionsCount < 3 && currentSize >= 3) {
		pool->mConnectionFreeTimeout.reset();
	}
	if (currentSize >= 3 && pool->mConnectionFreeTimeout.seconds() > UNUSED_CONNECTION_TIMEOUT_SECONDS) {
		// clean one connection and reset timer
		auto con = pool->mFreeConnections.top();
		pool->mFreeConnections.pop();
		currentSize = pool->mFreeConnections.size();

		mConnectionEstablishThread.addConnectionDestroy(con);
		mConnectionEstablishThread.condSignal();
		pool->mConnectionFreeTimeout.reset();

	}
	pool->mFreeConnectionsCount = currentSize;
}

Connection* ConnectionManager::createConnection(DRSimpleResourcePtr<Config>* cfg_ptr)
{

	auto con_cfg = static_cast<ConnectionConfig*>((Config*)(*cfg_ptr));
	switch (con_cfg->type) {
	case CONN_DEFAULT: return new Connection(cfg_ptr);
	case CONN_MYSQL: return new MysqlConnection(cfg_ptr);
	}
	return nullptr;
}

bool ConnectionManager::isConnectionPool(DHASH id)
{
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return false;
	}
	lock();
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return false;
	}
	auto it = mConnections.find(id);
	if (it == mConnections.end()) {
		unlock();
		return false;
	}
	unlock();
	return true;
}

Connection* ConnectionManager::getConnection(DHASH id)
{
	if (!mInitalized) {
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return nullptr;
	}
	lock();
	if (!mInitalized) {
		unlock();
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return nullptr;
	}
	auto it = mConnections.find(id);
	if (it == mConnections.end()) {
		addError(new ParamError(__FUNCTION__, "couldn't find connection pool for id:", id));
		unlock();
		return nullptr;
	}
	Connection* result = nullptr;
	auto pool = it->second;
	if (pool->mFreeConnections.size() > 0) {
		result = pool->mFreeConnections.top();
		pool->mFreeConnections.pop();
		checkTime(pool);
	}
	unlock();
	// if pool is empty, create new connection
	if (pool->mFreeConnections.size() == 0) {
		auto con = createConnection(pool->cfg_ptr);
		if (!con) {
			addError(new ParamError(__FUNCTION__, "couldn't create connection with cfg:", (*pool->cfg_ptr)->name));
			return nullptr;
		}
		mConnectionEstablishThread.addConnectionConnect(con);
		mConnectionEstablishThread.condSignal();
	}
	
	// we have get a connection, return
	if (result) {
		return result;
	}
	// we haven't get a connection, so we wait
	std::unique_lock<std::mutex> lk(mConnectCondMutex);
	mConnectCond.wait(lk, [] {return 1; });
	lock();
	if (!mInitalized) {
		unlock();
		addError(new Error(__FUNCTION__, "not initialized any more"));
		return nullptr;
	}

	if (pool->mFreeConnections.size() == 0) {
		addError(new Error(__FUNCTION__, "no free connection after wait :/"));
		unlock();
		return nullptr;
	}
	result = pool->mFreeConnections.top();
	pool->mFreeConnections.pop();
	checkTime(pool);
	unlock();
	return result;
}

// int ConnectionManager::connectMysql(
//	const char* db, 
//	const char* username /* = "root"*/, 
//	const char* pwd /* = nullptr*/, 
//	const char* url /* = "127.0.0.1" */, 
//	int port /*= 3306*/ )
// {
	//mysqlx://mike:s3cr3t!@localhost:13009
	/*std::stringstream urlStream;
	urlStream << username;
	if (pwd) {
		urlStream << ":" << pwd;
	}
	urlStream << "@" << url;
	urlStream << ":" << port;
	*/
	/*
	mysqlx::Session* mysqlSession = nullptr;
	try {
		mysqlSession = new mysqlx::Session(url, port, username, pwd, db);
	}
	catch (const char* e) {
		printf("[ConnectionManager::connectMysql] catch e: %s\n", e);
		return -1;
	}

	mWorkingMutex.lock();

	int handle = mMysqlConnections.size();
	mMysqlConnections.insert(std::pair<int, mysqlx::Session*>(handle, mysqlSession));
	
	return handle;
	
	return 0;
}
/*
mysqlx::Session* ConnectionManager::getMysqlConnection(int handle)
{
	mysqlx::Session* session = nullptr;
	mWorkingMutex.lock();
	auto it = mMysqlConnections.find(handle);
	if (it != mMysqlConnections.end()) {
		session = it->second;
	}
	mWorkingMutex.unlock();
	return session;
}
*/
