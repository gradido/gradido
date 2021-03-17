#ifndef __GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CRON_MANAGER_H
#define __GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CRON_MANAGER_H

#include "Poco/Timer.h"
#include "../controller/NodeServer.h"
#include "../tasks/CPUTask.h"


/*!
 * \author: Dario Rekowski
 *
 * \date: 2020-11-03
 *
 * \brief: Manager for "Cron"-like Tasks. 
 *
 *	Ping for example community server to get new blocks from nodes 
 *  or Hedera Tasks to (re)try receiving Transaction Receipts
 *
 */
class CronManager
{
public: 
	~CronManager();

	static CronManager* getInstance();

	bool init(long defaultPeriodicIntervallMilliseconds = 600000);
	void stop();

	void runUpdateStep(Poco::Timer& timer);
	void scheduleUpdateRun(Poco::Timespan timespanInFuture);


	void addNodeServerToPing(Poco::AutoPtr<controller::NodeServer> nodeServer);
	void removeNodeServerToPing(Poco::AutoPtr<controller::NodeServer> nodeServer);

protected:
	CronManager();

	bool isNodeServerInList(Poco::AutoPtr<controller::NodeServer> nodeServer);
	bool mInitalized;

	Poco::Timer mMainTimer;
	std::list<Poco::AutoPtr<controller::NodeServer>> mNodeServersToPing;
	std::list<Poco::Timestamp> mUpdateTimestamps;
	Poco::FastMutex mNodeServersToPingMutex;
	Poco::FastMutex mMainWorkMutex;
	Poco::FastMutex mTimestampsMutex;
	long mDefaultIntervalMilliseconds;
};

class PingServerTask : public UniLib::controller::CPUTask
{
public:
	PingServerTask(Poco::AutoPtr<controller::NodeServer> nodeServer);
	virtual ~PingServerTask();

	const char* getResourceType() const { return "PingServerTask"; }

	int run();

protected:
	Poco::AutoPtr<controller::NodeServer> mNodeServer;
};

#endif //__GRADIDO_LOGIN_SERVER_SINGLETON_MANAGER_CRON_MANAGER_H