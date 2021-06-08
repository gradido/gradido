
#include "TestTasks.h"
#include "Poco/Environment.h"
#include <sodium.h>
#include <math.h>
#include <iostream>

#include "Poco/Logger.h"
#include "Poco/Path.h"
#include "Poco/AsyncChannel.h"
#include "Poco/SimpleFileChannel.h"
#include "Poco/ConsoleChannel.h"
#include "Poco/SplitterChannel.h"

RandomCPUTask::RandomCPUTask(UniLib::controller::CPUSheduler* scheduler, TestTasks* parent, int nr)
	: UniLib::controller::CPUTask(scheduler), mParent(parent), mHeaviness(0), mNr(nr)
{
	int zahl = randombytes_random() % 2;
	if (zahl == 0) { 
		mType = RANDOM_CPU_TASK_CALCULATE; 
		mHeaviness = randombytes_random() % 10000 + 1000;
	}
	else { 
		mType = RANDOM_CPU_TASK_SLEEP; 
		mHeaviness = randombytes_random() % 1000;
	}
}

const char* RandomCPUTask::getName() const
{
	if (mType == RANDOM_CPU_TASK_CALCULATE) return "Calculate";
	if (mType == RANDOM_CPU_TASK_SLEEP) return "Sleep";
	return "not set";
}

RandomCPUTask::~RandomCPUTask()
{
	mParent->releaseTask(mNr);
}

int RandomCPUTask::run()
{
	if (mType == RANDOM_CPU_TASK_SLEEP) {
		Poco::Thread::sleep(mHeaviness);
	}
	else if (mType == RANDOM_CPU_TASK_CALCULATE) {
		for (int i = 0; i < mHeaviness; i++) {
			double zahl = sqrtf(powf(i, sqrtf(i)));
		}
	}
	return 0;
}

// *************************************************************************************

TestTasks::TestTasks()
	: mTaskScheduler(Poco::Environment::processorCount() * 4, "testScheduler")
{

}

TestTasks::~TestTasks()
{

}


int TestTasks::init()
{
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

	return 0;
}

int TestTasks::test()
{
	std::clog << "start with task test" << std::endl;
	auto workerCount = Poco::Environment::processorCount() * 4;
	auto taskCount = workerCount + workerCount * (randombytes_random() % 4);
	std::clog << "worker count: " << std::to_string(workerCount) << ", task count: " << std::to_string(taskCount) << std::endl;
	for (int i = 1; i <= taskCount; i++) {
		Poco::AutoPtr<RandomCPUTask> task = new RandomCPUTask(&mTaskScheduler, this, i);
		lock();
		mTasks.insert(std::pair<int, RandomCPUTask*>(i, task));
		unlock();
		task->scheduleTask(task);
		//std::clog << "start task: " << std::to_string(i) << std::endl;
	}

	std::clog << "all tasks started" << std::endl;
	int maxWaitCylces = 3000;
	bool finished = false;
	do {
		maxWaitCylces--;
		Poco::Thread::sleep(5);
		if(mErrors.size() > 0) {
			std::clog << std::to_string(mErrors.size()) << " errors" << std::endl;
		}
		try {
			lock();
			if (mTasks.size() == 0) {
				finished = true;
			}
			unlock();
		} catch(Poco::Exception& ex) {
			std::clog << "Poco Exception while waiting on tasks: " << ex.displayText() << std::endl;
		} catch(std::exception& ex) {
			std::clog << "std::exception while waiting on tasks: " << ex.what() << std::endl;
		}
	} while (!finished && maxWaitCylces > 0);
	std::clog << "all tasks now finished" << std::endl;

	lock();
	bool hasErrors = false;
	if (mTasks.size() > 0 || mErrors.size() > 0) {
		hasErrors = true;
		printf("[TestTasks::test] error running TestTasks\n");
		if (mTasks.size() > 0) {	
			printf("%d not exited\n", mTasks.size());
			for (auto it = mTasks.begin(); it != mTasks.end(); it++) {
				if (!it->second->isReady()) {
					printf("task %d not ready\n", it->first);
				}
				if (!it->second->isTaskFinished()) {
					printf("task %d isn't finished\n", it->first);
				}
			}
		}
		for (int i = 0; i < mErrors.size(); i++) {
			printf("error: %s\n", mErrors[i].data());
		}
	}
	unlock();
	
	if (hasErrors) {
		return -1;
	}

	return 0;
}


void TestTasks::releaseTask(int nr)
{
	lock();
	auto it = mTasks.find(nr);
	if (it != mTasks.end()) {
		mTasks.erase(it);
	}
	else {
		mErrors.push_back("[TestTasks] task entry not found" + std::to_string(nr));
	}
	unlock();

}