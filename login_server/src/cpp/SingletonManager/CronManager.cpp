#include "CronManager.h"
#include "../lib/JsonRequest.h"

#include "../ServerConfig.h"



CronManager::CronManager()
	: mInitalized(false), mMainTimer(1000, 600000)
{

}

CronManager::~CronManager()
{
	Poco::ScopedLock<Poco::FastMutex> _lock(mMainWorkMutex);
	
	mMainTimer.stop();
	mInitalized = false;
	
}

CronManager* CronManager::getInstance()
{
	static CronManager one;
	return &one;
}

bool CronManager::init(long defaultPeriodicIntervallMilliseconds/* = 600000*/)
{
	Poco::ScopedLock<Poco::FastMutex> _lock(mMainWorkMutex);
	mInitalized = true;
	controller::NodeServer::load(model::table::NODE_SERVER_GRADIDO_COMMUNITY);

	mDefaultIntervalMilliseconds = defaultPeriodicIntervallMilliseconds;
	mMainTimer.setPeriodicInterval(defaultPeriodicIntervallMilliseconds);
	Poco::TimerCallback<CronManager> callback(*this, &CronManager::runUpdateStep);
	mMainTimer.start(callback);

	return true;
}

void CronManager::stop()
{
	Poco::ScopedLock<Poco::FastMutex> _lock(mMainWorkMutex);
	mInitalized = false;
	mMainTimer.stop();
}

void CronManager::runUpdateStep(Poco::Timer& timer)
{
	auto current = Poco::DateTime();
	//printf("%s [CronManager::runUpdateStep] \n", Poco::DateTimeFormatter::format(current, "%d.%m.%y %H:%M:%S.%i").data());
	Poco::ScopedLock<Poco::FastMutex> _lock(mMainWorkMutex);
	if (!mInitalized) {
		return;
	}
	mNodeServersToPingMutex.lock();
	for (auto it = mNodeServersToPing.begin(); it != mNodeServersToPing.end(); it++) 
	{
		// TODO: Make sure that task not already running, for example if community server needs more time for processing that between calls 
		// or with schedule update run to short time between calls
		UniLib::controller::TaskPtr ping_node_server_task(new PingServerTask(*it));
		ping_node_server_task->scheduleTask(ping_node_server_task);
	}
	mNodeServersToPingMutex.unlock();

	mTimestampsMutex.lock();
	//printf("update timestamp sizes: %d\n", mUpdateTimestamps.size());
	bool timerRestarted = false;

	if (mUpdateTimestamps.size() > 0) 
	{
		Poco::Timestamp now;
		// update maximal once per second
		now += Poco::Timespan(1, 0);
		while (mUpdateTimestamps.size() > 0 && mUpdateTimestamps.front() < now) {
		//	printf("remove update time in past: %d\n", mUpdateTimestamps.front().epochTime());
			mUpdateTimestamps.pop_front();
		}
		if (mUpdateTimestamps.size() > 0) {
			Poco::Timespan next_run = mUpdateTimestamps.front() - now;
			//printf("timer restart called with: %d\n", next_run.seconds());
			//mMainTimer.setPeriodicInterval(next_run.totalMilliseconds());
			mMainTimer.restart(next_run.totalMilliseconds());
			mUpdateTimestamps.pop_front();
			timerRestarted = true;
		}
	}
	
	if (!timerRestarted && mMainTimer.getPeriodicInterval() != mDefaultIntervalMilliseconds) {
		//printf("reset to default interval\n"); 
		mMainTimer.setPeriodicInterval(mDefaultIntervalMilliseconds);
		//mMainTimer.restart(mDefaultIntervalMilliseconds);
	}
	mTimestampsMutex.unlock();
	//printf("[CronManager::runUpdateStep] end\n");
}

void CronManager::scheduleUpdateRun(Poco::Timespan timespanInFuture)
{
	Poco::Timestamp timestamp;
	timestamp += timespanInFuture;

	mTimestampsMutex.lock();
	//printf("[CronManager::scheduleUpdateRun] push:\n%d\n", timestamp.epochTime());
	mUpdateTimestamps.push_back(timestamp);
	mUpdateTimestamps.sort();
	auto frontTimestamp = mUpdateTimestamps.front();
	auto backTimestamp = mUpdateTimestamps.back();
	//printf("[CronManager::scheduleUpdateRun] front timestamp and back timestamp:\n%d\n%d\n", frontTimestamp.epochTime(), backTimestamp.epochTime());
	//printf("current: \n%d\n", Poco::Timestamp().epochTime());
	Poco::Timespan next_run = mUpdateTimestamps.front() - Poco::Timestamp();

	Poco::DateTime now;
	std::string now_string = Poco::DateTimeFormatter::format(now, "%d.%m.%y %H:%M:%S.%i");
	//printf("%s [CronManager::scheduleUpdateRun]  next run in %d seconds, %d millis (intervall: %d, default: %d)\n", 
		//now_string.data(), next_run.seconds(), next_run.milliseconds(), mMainTimer.getPeriodicInterval(), mDefaultIntervalMilliseconds);
	if (next_run.seconds() > 0 && mMainTimer.getPeriodicInterval() == mDefaultIntervalMilliseconds) {
		if (mMainWorkMutex.tryLock(100)) {
			mMainTimer.restart(next_run.totalMilliseconds());
			mUpdateTimestamps.pop_front();
			mMainWorkMutex.unlock();
		}
	}

	mTimestampsMutex.unlock();
	//printf("[CronManager::scheduleUpdateRun] end\n");
}


void CronManager::addNodeServerToPing(Poco::AutoPtr<controller::NodeServer> nodeServer)
{
	if (nodeServer.isNull() || !nodeServer->getModel()) {
		return;
	}
	if (isNodeServerInList(nodeServer)) {
		return;
	}
	mNodeServersToPingMutex.lock();
	mNodeServersToPing.push_back(nodeServer);
	mNodeServersToPingMutex.unlock();

}
void CronManager::removeNodeServerToPing(Poco::AutoPtr<controller::NodeServer> nodeServer)
{
	if (nodeServer.isNull() || !nodeServer->getModel()) {
		return;
	}
	mNodeServersToPingMutex.lock();
	int node_server_id = nodeServer->getModel()->getID();
	for (auto it = mNodeServersToPing.begin(); it != mNodeServersToPing.end(); it++) {
		if ((*it)->getModel()->getID() == node_server_id) {
			mNodeServersToPing.erase(it);
			break;
		}
	}
	mNodeServersToPingMutex.unlock();
}

bool CronManager::isNodeServerInList(Poco::AutoPtr<controller::NodeServer> nodeServer)
{
	bool result = false;
	mNodeServersToPingMutex.lock();
	int node_server_id = nodeServer->getModel()->getID();
	for (auto it = mNodeServersToPing.begin(); it != mNodeServersToPing.end(); it++) {
		if ((*it)->getModel()->getID() == node_server_id) {
			result = true;
			break;
		}
	}
	mNodeServersToPingMutex.unlock();
	return false;
}

// ***********************************************************************************************************
PingServerTask::PingServerTask(Poco::AutoPtr<controller::NodeServer> nodeServer)
	: CPUTask(ServerConfig::g_CPUScheduler), mNodeServer(nodeServer)
{

}

PingServerTask::~PingServerTask()
{

}

int PingServerTask::run()
{
	//return 0;
	auto current = Poco::DateTime();
	if (model::table::NODE_SERVER_GRADIDO_COMMUNITY == mNodeServer->getModel()->getNodeServerType()) {
		std::string url_port = mNodeServer->getModel()->getUrlWithPort();
		//printf("%s [PingServerTask::run] call update for %s\n", Poco::DateTimeFormatter::format(current, "%d.%m.%y %H:%M:%S.%i").data(), url_port.data());

		auto json_request = mNodeServer->createJsonRequest();
		json_request.request("updateReadNode");
	}
	return 0;
}