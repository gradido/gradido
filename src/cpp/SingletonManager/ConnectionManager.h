/*!
*
* \author: einhornimmond
*
* \date: 28.02.19
*
* \brief: manage Connections like mysql or socket connections to another server
*/

#ifndef DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H
#define DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H

#include "../LuaWebModule.h"
#include "../Connections/Connection.h"
#include "../CoreLib/Profiler.h"
#include "../CoreLib/Thread.h"
#include "../CoreLib/DRResourcePtr.h"
#include <queue>
#include <map>

#define UNUSED_CONNECTION_TIMEOUT_SECONDS 2

class ConnectionManager;

class ConnectThread : public Thread
{
public:
	ConnectThread(ConnectionManager* parent);
	virtual ~ConnectThread();

	void addConnectionConnect(Connection* connection);
	void addConnectionDestroy(Connection* connection);

protected:
	std::mutex mDataMutex;
	std::queue<Connection*> mConnectionsWaitingOnConnectCall;
	std::queue<Connection*> mConnectionWaitingOnDestroy;

	virtual int ThreadFunction();
	virtual void cleanUpInThread();

	bool initMysqlThread;
	ConnectionManager* mParent;
};


class ConnectionManager : public ErrorList
{
	friend ConnectThread;

public:
	~ConnectionManager();

	static ConnectionManager* getInstance();

	bool addConnectionPool(DRSimpleResourcePtr<Config>* cfg);
	bool markAsAvailable(Connection* con);

	bool isConnectionPool(DHASH id);
	
	static Connection* createConnection(DRSimpleResourcePtr<Config>* cfg);
	inline Connection* getConnection(const char* name) { return getConnection(DRMakeStringHash(name)); }

	Connection* getConnection(DHASH id);

	inline void lock() { mWorkingMutex.lock(); }
	inline void unlock() { mWorkingMutex.unlock(); }

	void deinitalize();

protected:
	ConnectionManager();

	struct ConnectionPool {
		ConnectionPool(): mFreeConnectionsCount(0), mErrorConnectingAttempts(0){}
		DRSimpleResourcePtr<Config>* cfg_ptr;
		std::stack<Connection*> mFreeConnections;
		// used to measure how long at least two connections not used
		Profiler mConnectionFreeTimeout;
		// only for calculating connection timeout
		int mFreeConnectionsCount;
		
		int mErrorConnectingAttempts;
	};

	void checkTime(ConnectionPool* pool);

	//  connection Pool
	std::map<int, ConnectionPool*> mConnections;

	// access mutex
	std::mutex mWorkingMutex;

	inline void condSignal() { mConnectCond.notify_one(); }
	
	// creating and destroying connections thread
	ConnectThread mConnectionEstablishThread;
	std::condition_variable mConnectCond;
	std::mutex mConnectCondMutex;

	bool		mInitalized;
};

#endif //DR_LUA_WEB_MODULE_CONNECTION_MANAGER_H
